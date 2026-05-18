import { NextRequest, NextResponse } from "next/server";
import { enrollInstance } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.enroll_token || !body?.hostname)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const res = await enrollInstance(body.enroll_token, body.hostname, body.facts ?? {});
  if (!res)
    return NextResponse.json({ error: "invalid enroll token" }, { status: 401 });
  return NextResponse.json(res);
}
