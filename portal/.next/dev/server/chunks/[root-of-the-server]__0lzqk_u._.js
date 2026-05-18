module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/install.sh/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
const runtime = "nodejs";
const dynamic = "force-dynamic";
async function GET(req) {
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
            "cache-control": "no-store"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0lzqk_u._.js.map