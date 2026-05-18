import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url =
  process.env.DATABASE_URL ?? "postgres://lum:lum@localhost:5432/lum";

// Reuse client across HMR reloads in dev.
const g = globalThis as unknown as { _pg?: ReturnType<typeof postgres> };
const client = g._pg ?? postgres(url, { max: 10 });
if (process.env.NODE_ENV !== "production") g._pg = client;

export const db = drizzle(client, { schema });
export { schema };
