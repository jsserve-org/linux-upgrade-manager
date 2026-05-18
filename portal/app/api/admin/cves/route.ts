import { NextRequest, NextResponse } from "next/server";
import { listCves } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sev = sp.get("severity");
  const cves = await listCves({
    q: sp.get("q") ?? undefined,
    severity: sev ? (sev.split(",") as any) : undefined,
    cpeContains: sp.get("cpe") ?? undefined,
    sinceMs: sp.get("since") ? Number(sp.get("since")) : undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 200,
  });
  return NextResponse.json({ cves });
}
