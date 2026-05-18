import { NextRequest, NextResponse } from "next/server";
import { deleteEnrollToken } from "@/lib/queries";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  await deleteEnrollToken(token);
  return NextResponse.json({ ok: true });
}
