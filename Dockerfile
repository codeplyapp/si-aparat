# Production Dockerfile for SI-APARAT API Backend
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm matching workspace version
RUN npm install -g pnpm@11.20.0

# Copy workspace source files (node_modules excluded via .dockerignore)
COPY . .

# Install dependencies for monorepo
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Compile API
RUN pnpm --filter api db:generate
RUN pnpm --filter api build

FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pnpm@11.20.0

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start"]
