# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – deps
#   Install all npm dependencies and generate the Prisma client.
#   We do this in a separate stage so the builder gets a warm node_modules
#   without needing to re-install on every code change.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

# OpenSSL is required by Prisma's library engine at generate + runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# ci install respects the lockfile exactly — no surprises in production.
RUN npm ci

# Generate the Prisma client inside node_modules.
# DATABASE_URL is NOT needed for generate — only for migrate/query.
RUN npx prisma generate


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – builder
#   Compile the Next.js app. Produces .next/standalone + .next/static.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy deps from previous stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source.
COPY . .

# Disable Next.js telemetry during build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the app.
# next.config.ts has output:'standalone' so this produces .next/standalone.
# Dummy env vars silence any build-time validation that expects them.
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 – runner
#   Minimal production image. Only contains the compiled output.
#   No source code, no dev dependencies, no secrets.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# next start binds to this port inside the container.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# OpenSSL needed by Prisma library engine at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for the process.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# ── Copy standalone Next.js output ──────────────────────────────────────────
# The standalone directory is a self-contained Node server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# ── Copy Prisma files needed at runtime ─────────────────────────────────────
# The generated client lives in node_modules inside standalone already,
# but we also need the schema for `prisma migrate deploy`.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Prisma CLI binary (used by entrypoint for migrations).
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/.bin/prisma        ./node_modules/.bin/prisma
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/prisma             ./node_modules/prisma
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/@prisma            ./node_modules/@prisma
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules/.prisma            ./node_modules/.prisma

# ── Entrypoint ───────────────────────────────────────────────────────────────
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
