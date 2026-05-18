import { NextResponse } from "next/server";
import { createEnrollToken, listEnrollTokens } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  const tokens = await listEnrollTokens();
  return NextResponse.json({ tokens });
}

export async function POST() {
  const token = await createEnrollToken();
  return NextResponse.json({ token });
}
