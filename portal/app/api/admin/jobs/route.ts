import { NextRequest, NextResponse } from "next/server";
import { createJobs, listJobs, JOB_TYPES, type JobType } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "200"),
    1000
  );
  const jobs = await listJobs(limit);
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.instance_ids?.length || !body?.type)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  if (!(JOB_TYPES as readonly string[]).includes(body.type))
    return NextResponse.json({ error: "unknown job type" }, { status: 400 });
  const ids = await createJobs(
    body.instance_ids,
    body.type as JobType,
    body.payload ?? {}
  );
  return NextResponse.json({ job_ids: ids });
}
