import { NextRequest, NextResponse } from "next/server";
import { authedInstance } from "@/lib/agent-auth";
import { claimPendingJobs } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const inst = await authedInstance(req);
  if (!inst) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const jobs = await claimPendingJobs(inst.id);
  return NextResponse.json({ jobs });
}
