import "server-only";
import { NextRequest } from "next/server";
import { getInstanceByToken, type Instance } from "./queries";

export async function authedInstance(req: NextRequest): Promise<Instance | null> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return getInstanceByToken(token);
}
