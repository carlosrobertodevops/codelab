#!/bin/sh
set -e

# Migrate (depende do DB estar up e DATABASE_URL correto no container)
if [ "${PRISMA_MIGRATE_DEPLOY:-1}" = "1" ]; then
  echo "[entrypoint] prisma migrate deploy"
  npx prisma migrate deploy
fi

# Seed opcional
if [ "${PRISMA_SEED:-0}" = "1" ]; then
  echo "[entrypoint] prisma db seed"
  npx prisma db seed
fi

echo "[entrypoint] starting next"
exec yarn start
