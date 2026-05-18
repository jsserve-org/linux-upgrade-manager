/**
 * Linux Upgrade Manager — Agent
 *
 * Runs on each managed Linux host. Polls the hub for jobs, executes them
 * against the local package manager, and pushes a periodic heartbeat with
 * facts (OS, kernel, available updates).
 *
 * Env:
 *   HUB_URL        e.g. http://hub.example.com:4000
 *   ENROLL_TOKEN   one-time token from the portal (only needed first run)
 *   STATE_FILE     where to persist the assigned agent token (default ./lum-agent.json)
 *   POLL_INTERVAL  seconds between polls (default 15)
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { hostname, arch, release } from "node:os";

const HUB = (process.env.HUB_URL ?? "http://localhost:3000").replace(/\/$/, "");
const STATE_FILE = process.env.STATE_FILE ?? "./lum-agent.json";
const POLL = parseInt(process.env.POLL_INTERVAL ?? "15") * 1000;

type State = { instance_id: string; agent_token: string };

// ---------- system facts ----------

type PkgMgr = "apt" | "dnf" | "yum" | "pacman" | "zypper" | "unknown";

function detectPkgMgr(): PkgMgr {
  const candidates: [string, PkgMgr][] = [
    ["/usr/bin/apt-get", "apt"],
    ["/usr/bin/dnf", "dnf"],
    ["/usr/bin/yum", "yum"],
    ["/usr/bin/pacman", "pacman"],
    ["/usr/bin/zypper", "zypper"],
  ];
  for (const [p, m] of candidates) if (existsSync(p)) return m;
  return "unknown";
}

function readOsRelease(): { name?: string; version?: string } {
  try {
    const txt = readFileSync("/etc/os-release", "utf8");
    const map: Record<string, string> = {};
    for (const line of txt.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) map[m[1]] = m[2].replace(/^"|"$/g, "");
    }
    return { name: map.NAME, version: map.VERSION ?? map.VERSION_ID };
  } catch {
    return {};
  }
}

function facts() {
  const os = readOsRelease();
  return {
    hostname: hostname(),
    os_name: os.name ?? "Linux",
    os_version: os.version ?? "",
    kernel: release(),
    arch: arch(),
    pkg_manager: detectPkgMgr(),
  };
}

// ---------- shell ----------

type RunResult = { exit_code: number; stdout: string; stderr: string };

function run(cmd: string, opts: { timeoutMs?: number } = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn("/bin/sh", ["-c", cmd], { env: process.env });
    let stdout = "";
    let stderr = "";
    const cap = (s: string, max = 200_000) => (s.length > max ? s.slice(-max) : s);
    child.stdout.on("data", (d) => (stdout = cap(stdout + d.toString())));
    child.stderr.on("data", (d) => (stderr = cap(stderr + d.toString())));
    const timeout = opts.timeoutMs
      ? setTimeout(() => child.kill("SIGKILL"), opts.timeoutMs)
      : null;
    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      resolve({ exit_code: code ?? -1, stdout, stderr });
    });
    child.on("error", (e) =>
      resolve({ exit_code: -1, stdout, stderr: stderr + String(e) })
    );
  });
}

// ---------- job handlers ----------

const PM = detectPkgMgr();

function checkUpdatesCmd(): string {
  switch (PM) {
    case "apt":
      return "apt-get update -qq && apt-get -s upgrade | grep -E '^Inst ' | wc -l";
    case "dnf":
      return "dnf -q check-update | grep -Ev '^$|Obsoleting' | wc -l || true";
    case "yum":
      return "yum -q check-update | grep -Ev '^$|Obsoleting' | wc -l || true";
    case "pacman":
      return "pacman -Sy >/dev/null 2>&1 && pacman -Qu | wc -l";
    case "zypper":
      return "zypper -q list-updates | grep -c '^v ' || true";
    default:
      return "echo 0";
  }
}

function installUpdatesCmd(securityOnly: boolean): string {
  switch (PM) {
    case "apt":
      return securityOnly
        ? "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::='--force-confold' upgrade -s | grep -i security || DEBIAN_FRONTEND=noninteractive apt-get -y upgrade"
        : "apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::='--force-confold' dist-upgrade";
    case "dnf":
      return securityOnly
        ? "dnf -y --security upgrade"
        : "dnf -y upgrade";
    case "yum":
      return securityOnly
        ? "yum -y --security update"
        : "yum -y update";
    case "pacman":
      return "pacman -Syu --noconfirm";
    case "zypper":
      return securityOnly
        ? "zypper -n patch --category security"
        : "zypper -n update";
    default:
      return "echo 'unknown package manager' >&2; exit 1";
  }
}

function installPackageCmd(pkgs: string[]): string {
  const safe = pkgs
    .filter((p) => /^[a-zA-Z0-9._+:-]+$/.test(p))
    .map((p) => `'${p}'`)
    .join(" ");
  if (!safe) return "echo 'no valid packages' >&2; exit 1";
  switch (PM) {
    case "apt":
      return `apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get -y install ${safe}`;
    case "dnf":
      return `dnf -y install ${safe}`;
    case "yum":
      return `yum -y install ${safe}`;
    case "pacman":
      return `pacman -S --noconfirm ${safe}`;
    case "zypper":
      return `zypper -n install ${safe}`;
    default:
      return "echo 'unknown package manager' >&2; exit 1";
  }
}

async function executeJob(job: any): Promise<RunResult> {
  switch (job.type) {
    case "check_updates": {
      const r = await run(checkUpdatesCmd(), { timeoutMs: 5 * 60_000 });
      // Best effort: parse count
      const n = parseInt(r.stdout.trim().split("\n").pop() ?? "0");
      if (!Number.isNaN(n)) state_updates = n;
      return r;
    }
    case "install_updates":
      return run(installUpdatesCmd(!!job.payload?.security_only), {
        timeoutMs: 60 * 60_000,
      });
    case "install_package":
      return run(installPackageCmd(job.payload?.packages ?? []), {
        timeoutMs: 30 * 60_000,
      });
    case "run_command":
      return run(String(job.payload?.command ?? ""), { timeoutMs: 30 * 60_000 });
    case "reboot":
      // Report success first; reboot scheduled after report below
      setTimeout(() => run("shutdown -r +1 'lum-agent scheduled reboot'"), 2000);
      return { exit_code: 0, stdout: "reboot scheduled in 1 minute", stderr: "" };
    default:
      return { exit_code: 1, stdout: "", stderr: `unknown job type: ${job.type}` };
  }
}

// ---------- enrollment + main loop ----------

let state_updates = 0;

async function loadOrEnroll(): Promise<State> {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
  }
  const enroll = process.env.ENROLL_TOKEN;
  if (!enroll)
    throw new Error("No state file and ENROLL_TOKEN not set; cannot enroll");
  const f = facts();
  const res = await fetch(`${HUB}/api/agent/enroll`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      enroll_token: enroll,
      hostname: f.hostname,
      facts: f,
    }),
  });
  if (!res.ok) throw new Error(`enroll failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as State;
  writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  console.log(`[agent] enrolled as instance ${data.instance_id}`);
  return data;
}

async function heartbeat(state: State) {
  await fetch(`${HUB}/api/agent/heartbeat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${state.agent_token}`,
    },
    body: JSON.stringify({
      facts: facts(),
      updates_available: state_updates,
    }),
  }).catch((e) => console.error("[agent] heartbeat failed:", e));
}

async function pollAndRun(state: State) {
  const res = await fetch(`${HUB}/api/agent/jobs`, {
    headers: { authorization: `Bearer ${state.agent_token}` },
  });
  if (!res.ok) {
    console.error("[agent] poll failed:", res.status);
    return;
  }
  const { jobs } = (await res.json()) as { jobs: any[] };
  for (const job of jobs) {
    console.log(`[agent] running job ${job.id} (${job.type})`);
    const result = await executeJob(job);
    await fetch(`${HUB}/api/agent/jobs/${job.id}/report`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${state.agent_token}`,
      },
      body: JSON.stringify(result),
    }).catch((e) => console.error("[agent] report failed:", e));
  }
}

async function main() {
  const state = await loadOrEnroll();
  console.log(`[agent] hub=${HUB} interval=${POLL}ms pkg=${PM}`);
  while (true) {
    await heartbeat(state);
    await pollAndRun(state);
    await new Promise((r) => setTimeout(r, POLL));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
