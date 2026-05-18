# Linux Upgrade Manager

A self-hosted "Action1-like" portal for managing OS updates across Linux fleets.

## Quick Start (Docker)

```bash
# 1. Clone and setup
cd linux_upgrade_manager
cp .env.example .env
# Edit .env and set secure passwords

# 2. Start services
./scripts/start.sh

# 3. Access the portal
open http://localhost:3001
```

## Architecture

- **portal/** — Next.js 16 (App Router, React 19). Single service. Owns the database via
  Drizzle + Postgres. Hosts both the web UI and the agent-facing API.
  - Agent API: `POST /api/agent/enroll`, `POST /api/agent/heartbeat`,
    `GET /api/agent/jobs`, `POST /api/agent/jobs/:id/report`
  - Admin API (same-origin, used by the UI): `/api/admin/instances`,
    `/api/admin/jobs`, `/api/admin/enroll-tokens`
- **agent/** — Bun script deployed to each managed Linux host. Polls the
  Next.js hub for jobs, executes them against the local package manager,
  reports back, and pushes a heartbeat with system facts.

## Deployment

### Docker Compose (Recommended)

**Development mode** (with hot reload, Adminer on :8080):
```bash
./scripts/start.sh dev
```

**Production mode**:
```bash
./scripts/start.sh prod
```

**Manual docker-compose commands:**
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f portal

# Restart portal
docker-compose restart portal

# Backup database
./scripts/backup.sh

# Stop everything
./scripts/stop.sh

# Full cleanup (removes volumes!)
./scripts/stop.sh -v
```

**Build images only:**
```bash
docker-compose build
# or
./scripts/start.sh build
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `lum` | Database password (change this!) |
| `BETTER_AUTH_SECRET` | — | Generate with `openssl rand -base64 32` |
| `ENROLL_TOKEN` | `changeme` | Token for agent enrollment |
| `PORTAL_PORT` | `3001` | Portal HTTP port |

See `.env.example` for full configuration including SSO options.

### Manual Development Setup

If you prefer not to use Docker for development:

```bash
# 1. Postgres
docker compose up -d postgres

# 2. Portal (hub)
cd portal
cp .env.example .env
npm install
npm run db:generate         # generate migrations from lib/schema.ts
npm run db:migrate          # apply them
ENROLL_TOKEN=changeme npm run dev   # http://localhost:3001

# 3. Agent — build standalone Linux binaries (on your dev machine, Bun required)
cd agent && bun install && bun run build
# Produces dist/lum-agent-linux-x64 and dist/lum-agent-linux-arm64

# 4. Deploy to a Linux host (NO Bun needed on the host)
scp dist/lum-agent-linux-x64 install.sh root@host:/tmp/
ssh root@host "cd /tmp && HUB_URL=http://hub.example.com:3001 \
  ENROLL_TOKEN=changeme ./install.sh ./lum-agent-linux-x64"
```

## Agent Enrollment

1. Start the portal and go to **Enroll** page
2. Create an enrollment token
3. Deploy agent to Linux hosts:

```bash
# Automatic install (one-liner)
curl -fsSL http://your-portal:3001/install.sh | \
  HUB_URL=http://your-portal:3001 ENROLL_TOKEN=xxx bash

# Or manual install
wget http://your-portal:3001/api/install/agent/x64 -O lum-agent
chmod +x lum-agent
./lum-agent --hub-url http://your-portal:3001 --enroll-token xxx
```

## Job Types

| type              | payload                          |
| ----------------- | -------------------------------- |
| `check_updates`   | none                             |
| `install_updates` | `{ security_only?: boolean }`    |
| `install_package` | `{ packages: string[] }`         |
| `run_command`     | `{ command: string }`            |
| `reboot`          | none                             |

The agent detects the package manager (apt / dnf / yum / pacman / zypper)
and runs the appropriate commands.

## Authentication (Authentik SSO)

The portal uses [better-auth](https://better-auth.com) with its `genericOAuth`
plugin pointed at an Authentik instance. Access is controlled entirely on the
Authentik side — bind whichever Authentik group/policy you want to the
application, and only those users can sign in.

When the OAuth env vars are unset, the hub runs in **dev mode** with no auth.
Set all three to engage SSO:

```bash
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3001
OAUTH_ISSUER=https://auth.example.com/application/o/lum-portal
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
```

### Authentik Setup

1. In Authentik, create a **Provider** → *OAuth2 / OpenID Provider*:
   - **Client type:** Confidential
   - **Redirect URIs:**
     ```
     http://localhost:3001/api/auth/oauth2/callback/authentik
     https://your-hub.example.com/api/auth/oauth2/callback/authentik
     ```
   - **Scopes:** `openid`, `email`, `profile`
   - Copy the generated **Client ID** and **Client Secret** into the env.
2. Create an **Application** that uses that provider. The application slug is
   what goes into `OAUTH_ISSUER` (e.g. application `lum-portal` →
   `OAUTH_ISSUER=https://auth.example.com/application/o/lum-portal`).
3. Bind whatever policies / group memberships you want to that application.
   Anyone Authentik permits will be allowed in; the hub trusts the IdP.

### What's Gated

- ✅ **Gated when SSO is on:** all UI pages, `/api/admin/*`
- 🔓 **Always public:** `/sign-in`, `/api/auth/*`, `/api/agent/*` (bearer-token
  authed per host), `/api/install/*` and `/install.sh` (so the install
  one-liner keeps working without a browser session)

## Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base services (postgres + portal) |
| `docker-compose.override.yml` | Dev overrides (hot reload, Adminer) |
| `docker-compose.prod.yml` | Production hardening (resource limits, logging) |

## Stack

- Next.js 16 (App Router, server components, React 19, Turbopack)
- Drizzle ORM + `postgres` driver
- Postgres 16
- Bun (agent runtime)
- Docker + Docker Compose
