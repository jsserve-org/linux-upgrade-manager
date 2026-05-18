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
  if (updatesAvailable !== null) set.updatesAvailable = updatesAvailable;
  if (securityUpdates !== null) set.securityUpdates = securityUpdates;
  await db.update(instances).set(set).where(eq(instances.id, id));
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
