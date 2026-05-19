# Multi-stage build for Linux Upgrade Manager
# Build from repo root: docker build -t lum-portal .

# ============================================
# Stage 0: Agent Builder (Bun)
# ============================================
FROM oven/bun:1-alpine AS agent-builder
WORKDIR /agent
COPY agent/package.json agent/agent.ts agent/build.ts ./
RUN bun install
RUN bun run build

# ============================================
# Stage 1: Portal Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY portal/package.json portal/package-lock.json* ./
RUN npm ci && npm cache clean --force

# ============================================
# Stage 2: Portal Builder
# ============================================
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY portal/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create uploads directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Copy agent binaries to expected location (../agent/dist from /app)
COPY --from=agent-builder /agent/dist/lum-agent-linux-x64 /app/agent/dist/lum-agent-linux-x64
COPY --from=agent-builder /agent/dist/lum-agent-linux-arm64 /app/agent/dist/lum-agent-linux-arm64

# Copy portal files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e
echo "🔄 Running database migrations..."
npx drizzle-kit migrate
echo "🚀 Starting portal..."
exec node server.js
EOF
RUN chmod +x /app/start.sh && chown nextjs:nodejs /app/start.sh

USER nextjs
EXPOSE 3001
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:3001/api/health || exit 1

CMD ["/app/start.sh"]
