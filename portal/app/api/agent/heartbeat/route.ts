import { NextRequest, NextResponse } from "next/server";
import { authedInstance } from "@/lib/agent-auth";
import { heartbeatInstance } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const inst = await authedInstance(req);
  if (!inst) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  await heartbeatInstance(
    inst.id,
    body.facts ?? {},
    body.updates_available ?? null,
    body.security_updates ?? null
  );
  return NextResponse.json({ ok: true });
}
