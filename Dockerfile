# SI-APARAT API – Render Docker Build
# Uses node:22-bookworm-slim (Debian 12, glibc) – compatible with pnpm 11, Prisma 5, Sharp
FROM node:22-bookworm-slim AS base

# Prisma needs openssl, Sharp needs libvips deps
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@11.20.0

WORKDIR /app

# ── Dependency install ─────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only package.json files first (layer cache optimisation)
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# ── Build ──────────────────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Bring installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true

# Copy full source
COPY . .

# Generate Prisma client then compile TypeScript
RUN pnpm --filter api db:generate
RUN pnpm --filter api build

# ── Runtime ────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy everything built
COPY --from=builder /app ./

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
