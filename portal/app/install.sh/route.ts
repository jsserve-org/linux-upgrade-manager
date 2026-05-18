import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /install.sh — returns a self-contained installer that pulls the binary
// from this same hub. Designed for: curl -fsSL http://hub/install.sh | sudo HUB_URL=… ENROLL_TOKEN=… bash
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const script = `#!/usr/bin/env bash
# Linux Upgrade Manager — agent installer
set -euo pipefail

HUB_URL="\${HUB_URL:-${origin}}"
: "\${ENROLL_TOKEN:?ENROLL_TOKEN is required (set with: ENROLL_TOKEN=xxx ...)}"

if [ "\$(id -u)" -ne 0 ]; then
  echo "must run as root (use sudo)" >&2; exit 1
fi

case "\$(uname -m)" in
  x86_64|amd64) ARCH=x64 ;;
  aarch64|arm64) ARCH=arm64 ;;
  *) echo "unsupported arch: \$(uname -m)" >&2; exit 1 ;;
esac

DEST=/opt/lum-agent
install -d "\$DEST"

echo "[lum] downloading agent (\$ARCH) from \$HUB_URL ..."
curl -fsSL "\$HUB_URL/api/install/agent/\$ARCH" -o "\$DEST/lum-agent.new"
chmod +x "\$DEST/lum-agent.new"
mv "\$DEST/lum-agent.new" "\$DEST/lum-agent"

cat >/etc/systemd/system/lum-agent.service <<EOF
[Unit]
Description=Linux Upgrade Manager agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=HUB_URL=\$HUB_URL
Environment=ENROLL_TOKEN=\$ENROLL_TOKEN
Environment=STATE_FILE=\$DEST/state.json
WorkingDirectory=\$DEST
ExecStart=\$DEST/lum-agent
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now lum-agent.service
echo "[lum] agent running. tail logs:  journalctl -u lum-agent -f"
`;
  return new Response(script, {
    headers: {
      "content-type": "text/x-shellscript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
