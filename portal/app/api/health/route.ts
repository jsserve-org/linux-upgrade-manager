import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    server: "ok",
    database: "error",
  };

  let status = 200;

  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);
    checks.database = "ok";
  } catch (e) {
    checks.database = "error";
    status = 503;
  }

  return NextResponse.json(
    {
      status: status === 200 ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
