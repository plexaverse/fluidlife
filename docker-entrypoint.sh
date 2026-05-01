#!/bin/sh
set -e

# ── Optional: run Prisma migrations on startup ────────────────────────────
# Set RUN_MIGRATIONS=true in your environment (e.g. Cloud Run job, K8s init
# container, or first-time docker-compose up) to apply pending migrations
# before the server starts.
#
# For production it is safer to run migrations as a separate one-off command
# rather than on every container start:
#   docker run --rm --env-file .env <image> npx prisma migrate deploy
#
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  node_modules/.bin/prisma migrate deploy
  echo "[entrypoint] Migrations complete."
fi

# ── Start Next.js ─────────────────────────────────────────────────────────
echo "[entrypoint] Starting Next.js on port ${PORT:-3000}..."
exec node server.js
