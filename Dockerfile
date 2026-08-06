# Production Dockerfile for SI-APARAT API Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy packages and apps
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Compile TypeScript
RUN pnpm --filter api db:generate
RUN pnpm --filter api build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start"]
