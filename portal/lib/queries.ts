import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  instances,
  jobs,
  enrollTokens,
  cves,
  cveSyncState,
  type Instance,
  type Job,
  type Cve,
} from "./schema";

export const newId = () => randomUUID();
export type { Instance, Job, Cve };

// ---------- enrollment tokens ----------

export async function ensureSeedToken() {
  const seed = process.env.ENROLL_TOKEN;
  if (!seed) return;
  await db
    .insert(enrollTokens)
    .values({ token: seed, createdAt: Date.now() })
    .onConflictDoNothing();
}

export async function createEnrollToken() {
  const token = randomUUID().replace(/-/g, "");
  await db.insert(enrollTokens).values({ token, createdAt: Date.now() });
  return token;
}

export async function listEnrollTokens() {
  return db.select().from(enrollTokens).orderBy(desc(enrollTokens.createdAt));
}

export async function deleteEnrollToken(token: string) {
  await db.delete(enrollTokens).where(eq(enrollTokens.token, token));
}

async function getEnrollToken(token: string) {
  const [row] = await db
    .select()
    .from(enrollTokens)
    .where(eq(enrollTokens.token, token));
  return row ?? null;
}

// ---------- instances ----------

export async function listInstances(): Promise<Instance[]> {
  return db.select().from(instances).orderBy(asc(instances.hostname));
}

export async function getInstance(id: string): Promise<Instance | null> {
  const [row] = await db.select().from(instances).where(eq(instances.id, id));
  return row ?? null;
}

export async function getInstanceByToken(
  token: string
): Promise<Instance | null> {
  const [row] = await db
    .select()
    .from(instances)
    .where(eq(instances.agentToken, token));
  return row ?? null;
}

export async function deleteInstance(id: string) {
  await db.delete(instances).where(eq(instances.id, id));
}

export type EnrollFacts = {
  os_name?: string;
  os_version?: string;
  kernel?: string;
  arch?: string;
  pkg_manager?: string;
  hostname?: string;
  packages?: { name: string; version?: string; source?: string }[];
  docker?: Instance["dockerInventory"];
};

export async function enrollInstance(
  enrollToken: string,
  hostname: string,
  facts: EnrollFacts
) {
  const tok = await getEnrollToken(enrollToken);
  if (!tok) return null;
  const id = newId();
  const agentToken = newId().replace(/-/g, "");
  const now = Date.now();
  await db.insert(instances).values({
    id,
    hostname,
    agentToken,
    osName: facts.os_name ?? null,
    osVersion: facts.os_version ?? null,
    kernel: facts.kernel ?? null,
    arch: facts.arch ?? null,
    pkgManager: facts.pkg_manager ?? null,
    packageInventory: normalizePackages(facts.packages),
    dockerInventory: normalizeDockerInventory(facts.docker),
    enrolledAt: now,
    lastSeen: now,
  });
  return { instance_id: id, agent_token: agentToken };
}

export async function heartbeatInstance(
  id: string,
  facts: EnrollFacts,
  updatesAvailable: number | null,
  securityUpdates: number | null
) {
  const set: Partial<typeof instances.$inferInsert> = { lastSeen: Date.now() };
  if (facts.hostname) set.hostname = facts.hostname;
  if (facts.os_name) set.osName = facts.os_name;
  if (facts.os_version) set.osVersion = facts.os_version;
  if (facts.kernel) set.kernel = facts.kernel;
  if (facts.arch) set.arch = facts.arch;
  if (facts.pkg_manager) set.pkgManager = facts.pkg_manager;
  if (facts.packages) set.packageInventory = normalizePackages(facts.packages);
  if (facts.docker) set.dockerInventory = normalizeDockerInventory(facts.docker);
  if (updatesAvailable !== null) set.updatesAvailable = updatesAvailable;
  if (securityUpdates !== null) set.securityUpdates = securityUpdates;
  await db.update(instances).set(set).where(eq(instances.id, id));
}

function normalizePackages(pkgs: EnrollFacts["packages"]) {
  if (!Array.isArray(pkgs)) return [];
  const seen = new Set<string>();
  return pkgs
    .filter((p) => p && typeof p.name === "string")
    .map((p) => ({
      name: p.name.trim().slice(0, 120),
      version: p.version?.trim().slice(0, 160),
      source: p.source?.trim().slice(0, 40),
    }))
    .filter((p) => {
      if (!p.name || seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    })
    .slice(0, 5000);
}

function normalizeDockerInventory(docker: EnrollFacts["docker"]) {
  return {
    containers: Array.isArray(docker?.containers)
      ? docker.containers
          .filter((c) => c && typeof c.name === "string")
          .map((c) => ({
            id: String(c.id ?? "").slice(0, 64),
            name: String(c.name ?? "").slice(0, 160),
            image: String(c.image ?? "").slice(0, 240),
            imageId: c.imageId ? String(c.imageId).slice(0, 120) : undefined,
            state: c.state ? String(c.state).slice(0, 40) : undefined,
            status: c.status ? String(c.status).slice(0, 160) : undefined,
          }))
          .slice(0, 500)
      : [],
    images: Array.isArray(docker?.images)
      ? docker.images
          .filter((i) => i && typeof i.repository === "string")
          .map((i) => ({
            id: String(i.id ?? "").slice(0, 120),
            repository: String(i.repository ?? "").slice(0, 240),
            tag: String(i.tag ?? "").slice(0, 120),
            digest: i.digest ? String(i.digest).slice(0, 240) : undefined,
            created: i.created ? String(i.created).slice(0, 80) : undefined,
            size: i.size ? String(i.size).slice(0, 80) : undefined,
          }))
          .slice(0, 500)
      : [],
  };
}

// ---------- jobs ----------

export const JOB_TYPES = [
  "check_updates",
  "install_updates",
  "install_package",
  "run_command",
  "reboot",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export async function createJobs(
  instanceIds: string[],
  type: JobType,
  payload: Record<string, unknown>
) {
  const now = Date.now();
  const rows = instanceIds.map((iid) => ({
    id: newId(),
    instanceId: iid,
    type,
    payload,
    status: "pending" as const,
    createdAt: now,
  }));
  if (rows.length) await db.insert(jobs).values(rows);
  return rows.map((r) => r.id);
}

export async function listJobs(limit = 200) {
  return db
    .select({
      id: jobs.id,
      instanceId: jobs.instanceId,
      hostname: instances.hostname,
      type: jobs.type,
      payload: jobs.payload,
      status: jobs.status,
      createdAt: jobs.createdAt,
      pickedAt: jobs.pickedAt,
      finishedAt: jobs.finishedAt,
      exitCode: jobs.exitCode,
      stdout: jobs.stdout,
      stderr: jobs.stderr,
    })
    .from(jobs)
    .innerJoin(instances, eq(instances.id, jobs.instanceId))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}

export async function listJobsForInstance(instanceId: string, limit = 100) {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.instanceId, instanceId))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}

export async function claimPendingJobs(instanceId: string): Promise<Job[]> {
  // Atomic: select pending → set running, return rows.
  const now = Date.now();
  const updated = await db
    .update(jobs)
    .set({ status: "running", pickedAt: now })
    .where(
      and(
        eq(jobs.instanceId, instanceId),
        eq(jobs.status, "pending"),
      )
    )
    .returning();
  // touch last_seen
  await db
    .update(instances)
    .set({ lastSeen: now })
    .where(eq(instances.id, instanceId));
  return updated.sort((a, b) => a.createdAt - b.createdAt);
}

export async function reportJob(
  instanceId: string,
  jobId: string,
  exitCode: number | null,
  stdout: string | null,
  stderr: string | null,
  status?: Job["status"]
) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.instanceId, instanceId)));
  if (!job) return false;
  const finalStatus =
    status ?? ((exitCode ?? 1) === 0 ? "succeeded" : "failed");
  await db
    .update(jobs)
    .set({
      status: finalStatus,
      exitCode,
      stdout,
      stderr,
      finishedAt: Date.now(),
    })
    .where(eq(jobs.id, jobId));
  return true;
}

// ---------- view helpers ----------

// ---------- CVEs ----------

export type CveFilter = {
  q?: string;
  severity?: ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "UNKNOWN")[];
  cpeContains?: string; // e.g. "ubuntu", "debian", "fedora"
  sinceMs?: number;     // published_at >= sinceMs
  limit?: number;
};

export type AffectedCve = Cve & {
  affected: {
    instanceId: string;
    hostname: string;
    reasons: string[];
  }[];
};

export async function listCves(f: CveFilter = {}): Promise<Cve[]> {
  const conds = [];
  if (f.q && f.q.trim()) {
    const like = `%${f.q.trim()}%`;
    conds.push(or(ilike(cves.id, like), ilike(cves.title, like))!);
  }
  if (f.severity?.length) {
    conds.push(inArray(cves.severity, f.severity));
  }
  if (f.cpeContains && f.cpeContains.trim()) {
    const needle = f.cpeContains.trim().toLowerCase();
    // jsonb array containment via SQL — match if any element contains the substring
    conds.push(
      sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${cves.cpes}) AS x WHERE x ILIKE ${`%${needle}%`})`
    );
  }
  if (f.sinceMs) conds.push(gte(cves.publishedAt, f.sinceMs));

  const base = db.select().from(cves);
  const filtered = conds.length ? base.where(and(...conds)) : base;
  return filtered.orderBy(desc(cves.publishedAt)).limit(f.limit ?? 100);
}

export async function getCve(id: string): Promise<Cve | null> {
  const [row] = await db.select().from(cves).where(eq(cves.id, id));
  return row ?? null;
}

export async function listAffectedCves(f: CveFilter = {}): Promise<AffectedCve[]> {
  const candidates = await listCves({ ...f, limit: Math.max(f.limit ?? 250, 1000) });
  const fleet = await listInstances();
  const out: AffectedCve[] = [];
  for (const cve of candidates) {
    const affected = fleet
      .map((inst) => ({
        instanceId: inst.id,
        hostname: inst.hostname,
        reasons: matchCveToInstance(cve, inst),
      }))
      .filter((m) => m.reasons.length > 0);
    if (affected.length) out.push({ ...cve, affected });
    if (out.length >= (f.limit ?? 250)) break;
  }
  return out;
}

export async function affectedCveSeverityCounts(sinceMs?: number) {
  const rows = await listAffectedCves({ sinceMs, limit: 2000 });
  const out = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0, UNKNOWN: 0 };
  for (const r of rows) (out as any)[r.severity] += 1;
  return out;
}

function matchCveToInstance(cve: Cve, inst: Instance): string[] {
  const haystack = cve.cpes.join("\n").toLowerCase();
  if (!haystack) return [];
  const reasons = new Set<string>();
  for (const token of instanceMatchTokens(inst)) {
    if (token.value.length < 3) continue;
    if (haystack.includes(token.value)) reasons.add(token.label);
  }
  return [...reasons].slice(0, 8);
}

function instanceMatchTokens(inst: Instance): { value: string; label: string }[] {
  const tokens: { value: string; label: string }[] = [];
  const add = (value: string | null | undefined, label: string) => {
    const clean = normalizeCveToken(value);
    if (clean) tokens.push({ value: clean, label });
  };

  add(inst.osName, inst.osName ? `OS: ${inst.osName}` : "OS");
  for (const part of osAliases(inst.osName)) add(part, `OS: ${inst.osName}`);

  for (const pkg of inst.packageInventory ?? []) {
    add(pkg.name, `Package: ${pkg.name}`);
  }

  const docker = inst.dockerInventory;
  for (const image of docker?.images ?? []) {
    for (const part of dockerImageTokens(`${image.repository}:${image.tag}`)) {
      add(part, `Image: ${image.repository}:${image.tag}`);
    }
  }
  for (const container of docker?.containers ?? []) {
    for (const part of dockerImageTokens(container.image)) {
      add(part, `Container: ${container.image}`);
    }
  }

  const seen = new Set<string>();
  return tokens.filter((t) => {
    const key = `${t.value}:${t.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCveToken(value: string | null | undefined) {
  const clean = String(value ?? "")
    .toLowerCase()
    .replace(/^sha256:/, "")
    .replace(/[^a-z0-9_.+-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!clean || clean === "latest" || clean === "none" || clean === "unknown") return null;
  return clean;
}

function osAliases(osName?: string | null) {
  const s = osName?.toLowerCase() ?? "";
  if (s.includes("debian")) return ["debian", "debian_linux"];
  if (s.includes("ubuntu")) return ["ubuntu", "ubuntu_linux"];
  if (s.includes("fedora")) return ["fedora"];
  if (s.includes("rocky")) return ["rocky", "rocky_linux"];
  if (s.includes("alma")) return ["almalinux", "alma_linux"];
  if (s.includes("red hat") || s === "rhel") return ["redhat", "red_hat_enterprise_linux"];
  if (s.includes("centos")) return ["centos"];
  if (s.includes("suse")) return ["suse", "opensuse"];
  if (s.includes("arch")) return ["arch_linux"];
  return [];
}

function dockerImageTokens(image: string) {
  const withoutDigest = image.split("@")[0];
  const withoutTag = withoutDigest.replace(/:[^/:]+$/, "");
  const parts = withoutTag.split("/").filter(Boolean);
  const repo = parts.at(-1) ?? withoutTag;
  return [repo, repo.replace(/^library\//, ""), withoutTag];
}

export async function cveSeverityCounts(sinceMs?: number) {
  const conds = sinceMs ? [gte(cves.publishedAt, sinceMs)] : [];
  const rows = await db
    .select({ severity: cves.severity, n: sql<number>`count(*)::int` })
    .from(cves)
    .where(conds.length ? and(...conds) : sql`true`)
    .groupBy(cves.severity);
  const out = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0, UNKNOWN: 0 };
  for (const r of rows) (out as any)[r.severity] = r.n;
  return out;
}

export async function lastCveSync(): Promise<number | null> {
  const [row] = await db
    .select()
    .from(cveSyncState)
    .where(eq(cveSyncState.source, "nvd"));
  return row?.lastSyncedAt ?? null;
}

// ---------- fleet stats ----------

export async function fleetStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      online: sql<number>`count(*) filter (where ${instances.lastSeen} > ${Date.now() - 90_000})::int`,
      needUpdates: sql<number>`count(*) filter (where ${instances.updatesAvailable} > 0)::int`,
      needSecurity: sql<number>`count(*) filter (where ${instances.securityUpdates} > 0)::int`,
    })
    .from(instances);
  return row;
}
