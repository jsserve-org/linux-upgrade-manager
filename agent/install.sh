#!/usr/bin/env bash
# Install lum-agent from a prebuilt standalone binary (no Bun required on host).
# Usage:  sudo HUB_URL=http://hub:3001 ENROLL_TOKEN=xxx ./install.sh [path/to/binary]
#
# If a binary path isn't given, looks for ./dist/lum-agent-linux-<arch>.
set -euo pipefail

: "${HUB_URL:?HUB_URL is required}"
: "${ENROLL_TOKEN:?ENROLL_TOKEN is required}"

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) BIN_ARCH=x64 ;;
  aarch64|arm64) BIN_ARCH=arm64 ;;
  *) echo "unsupported arch: $ARCH" >&2; exit 1 ;;
esac

SRC="${1:-./dist/lum-agent-linux-${BIN_ARCH}}"
if [ ! -f "$SRC" ]; then
  echo "binary not found at $SRC — run 'bun run build' first, or pass a path" >&2
  exit 1
fi

DEST=/opt/lum-agent
install -d "$DEST"
install -m 0755 "$SRC" "$DEST/lum-agent"

cat >/etc/systemd/system/lum-agent.service <<EOF
[Unit]
Description=Linux Upgrade Manager agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=HUB_URL=${HUB_URL}
Environment=ENROLL_TOKEN=${ENROLL_TOKEN}
Environment=STATE_FILE=${DEST}/state.json
WorkingDirectory=${DEST}
ExecStart=${DEST}/lum-agent
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now lum-agent.service
echo "[install] lum-agent is running. journalctl -u lum-agent -f"
