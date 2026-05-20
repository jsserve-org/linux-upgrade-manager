import {
  pgTable,
  text,
  integer,
  bigint,
  jsonb,
  index,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const instances = pgTable("instances", {
  id: text("id").primaryKey(),
  hostname: text("hostname").notNull(),
  agentToken: text("agent_token").notNull().unique(),
  osName: text("os_name"),
  osVersion: text("os_version"),
  kernel: text("kernel"),
  arch: text("arch"),
  pkgManager: text("pkg_manager"),
  updatesAvailable: integer("updates_available").notNull().default(0),
  securityUpdates: integer("security_updates").notNull().default(0),
  lastSeen: bigint("last_seen", { mode: "number" }),
  enrolledAt: bigint("enrolled_at", { mode: "number" }).notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  packageInventory: jsonb("package_inventory")
    .$type<{ name: string; version?: string; source?: string }[]>()
    .notNull()
    .default([]),
  dockerInventory: jsonb("docker_inventory")
    .$type<{
      containers: {
        id: string;
        name: string;
        image: string;
        imageId?: string;
        state?: string;
        status?: string;
      }[];
      images: {
        id: string;
        repository: string;
        tag: string;
        digest?: string;
        created?: string;
        size?: string;
      }[];
    }>()
    .notNull()
    .default({ containers: [], images: [] }),
});

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    instanceId: text("instance_id")
      .notNull()
      .references(() => instances.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status", {
      enum: ["pending", "running", "succeeded", "failed"],
    })
      .notNull()
      .default("pending"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    pickedAt: bigint("picked_at", { mode: "number" }),
    finishedAt: bigint("finished_at", { mode: "number" }),
    exitCode: integer("exit_code"),
    stdout: text("stdout"),
    stderr: text("stderr"),
  },
  (t) => ({
    instStatus: index("idx_jobs_instance_status").on(t.instanceId, t.status),
  })
);

export const enrollTokens = pgTable("enroll_tokens", {
  token: text("token").primaryKey(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  used: integer("used").notNull().default(0),
});

export const cves = pgTable(
  "cves",
  {
    id: text("id").primaryKey(),                     // CVE-YYYY-NNNN
    publishedAt: bigint("published_at", { mode: "number" }).notNull(),
    modifiedAt: bigint("modified_at", { mode: "number" }).notNull(),
    severity: text("severity", {
      enum: ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"],
    })
      .notNull()
      .default("UNKNOWN"),
    cvssScore: integer("cvss_score"),                // x10 to keep as int (e.g. 7.5 -> 75)
    cvssVector: text("cvss_vector"),
    title: text("title").notNull(),                  // first sentence of description
    description: text("description").notNull(),
    cwes: jsonb("cwes").$type<string[]>().notNull().default([]),
    refs: jsonb("refs").$type<{ url: string; tags?: string[] }[]>().notNull().default([]),
    cpes: jsonb("cpes").$type<string[]>().notNull().default([]),
    source: text("source").notNull().default("nvd"),
    syncedAt: bigint("synced_at", { mode: "number" }).notNull(),
  },
  (t) => ({
    bySeverity: index("idx_cves_severity_pub").on(t.severity, t.publishedAt),
    byPub: index("idx_cves_published_at").on(t.publishedAt),
  })
);

export const cveSyncState = pgTable("cve_sync_state", {
  source: text("source").primaryKey(),
  lastSyncedAt: bigint("last_synced_at", { mode: "number" }).notNull(),
  lastCursor: text("last_cursor"),                   // ISO timestamp of last modStartDate
});

// ---------- better-auth tables ----------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Instance = typeof instances.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type EnrollToken = typeof enrollTokens.$inferSelect;
export type Cve = typeof cves.$inferSelect;
export type User = typeof user.$inferSelect;
