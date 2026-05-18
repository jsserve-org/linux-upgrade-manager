import { NextRequest, NextResponse } from "next/server";
import { deleteInstance } from "@/lib/queries";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteInstance(id);
  return NextResponse.json({ ok: true });
}
