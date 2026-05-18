import { NextRequest, NextResponse } from "next/server";
import { syncCves } from "@/lib/cve-sync";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const res = await syncCves({
      lookbackDays: body.lookback_days ?? undefined,
    });
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
