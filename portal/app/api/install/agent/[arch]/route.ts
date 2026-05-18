import { NextRequest } from "next/server";
import { createReadStream, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Look for binaries beside the portal (../agent/dist) — works in dev and when
// the repo is deployed as-is. Override with LUM_AGENT_DIST=/abs/path if needed.
const DIST_DIR =
  process.env.LUM_AGENT_DIST ?? resolve(process.cwd(), "../agent/dist");

const ALLOWED = new Set(["x64", "arm64"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ arch: string }> }
) {
  const { arch } = await params;
  if (!ALLOWED.has(arch))
    return new Response("unsupported arch", { status: 400 });

  const file = join(DIST_DIR, `lum-agent-linux-${arch}`);
  if (!existsSync(file))
    return new Response(
      `binary not built yet — run 'bun run build' in /agent\nlooked at: ${file}`,
      { status: 404 }
    );

  const stat = statSync(file);
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(stat.size),
      "content-disposition": `attachment; filename="lum-agent"`,
    },
  });
}
