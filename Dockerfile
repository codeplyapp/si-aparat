# Production Dockerfile for SI-APARAT API Backend
# node:22-slim = Debian glibc (required for Prisma & Sharp) + Node 22 (required for pnpm 11)
FROM node:22-slim AS builder

WORKDIR /app

# openssl required by Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm matching workspace version
RUN npm install -g pnpm@11.20.0

# Copy workspace source files (node_modules excluded via .dockerignore)
COPY . .

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & compile TypeScript
RUN pnpm --filter api db:generate
RUN pnpm --filter api build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@11.20.0

COPY --from=builder /app ./

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
