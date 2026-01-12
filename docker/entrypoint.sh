#!/usr/bin/env sh
set -eu

# The app must start even if optional services (like Clerk) are not configured.
# DB migrations, however, should run when DATABASE_URL is provided.

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Running Prisma migrate deploy"
  npx prisma migrate deploy
  echo "[entrypoint] Running Prisma generate"
  npx prisma generate
else
  echo "[entrypoint] DATABASE_URL is empty; skipping migrate/generate"
fi

echo "[entrypoint] Starting Next.js"
node server.js
