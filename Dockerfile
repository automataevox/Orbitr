# Orbitr - Production Dockerfile

# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install dependencies with production flag
RUN pnpm install --frozen-lockfile --prod=false

# ============================================================================
# STAGE 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/turbo.json ./turbo.json

# Copy all source code
COPY apps ./apps
COPY packages ./packages

# Generate Prisma client
RUN pnpm --filter @orbitr/database prisma generate

# Copy Prisma client to pnpm isolated modules (workaround for pnpm)
RUN mkdir -p node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma && \
    cp -r node_modules/.prisma/client node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client || true

# Build all packages and the Next.js app
ENV NODE_ENV=production
RUN pnpm build

# ============================================================================
# STAGE 3: Production Runner
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    docker-cli \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 orbitr \
    && mkdir -p /app/data /app/extensions /app/logs \
    && chown -R orbitr:nodejs /app

# Copy standalone Next.js build
COPY --from=builder --chown=orbitr:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=orbitr:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=orbitr:nodejs /app/apps/web/public ./apps/web/public

# Copy Prisma files
COPY --from=builder --chown=orbitr:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=orbitr:nodejs /app/packages/database/prisma ./packages/database/prisma

# Switch to non-root user
USER orbitr

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/app/data/orbitr.db \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health/simple', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "apps/web/server.js"]
