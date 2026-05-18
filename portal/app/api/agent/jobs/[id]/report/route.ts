import { NextRequest, NextResponse } from "next/server";
import { authedInstance } from "@/lib/agent-auth";
import { reportJob } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const inst = await authedInstance(req);
  if (!inst) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ok = await reportJob(
    inst.id,
    id,
    body.exit_code ?? null,
    body.stdout ?? null,
    body.stderr ?? null,
    body.status
  );
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
