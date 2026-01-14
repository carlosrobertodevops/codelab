# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# -------------------------
# deps
# -------------------------
FROM base AS deps
COPY package.json yarn.lock ./
# evita postinstall quebrando (migrate deploy etc.)
RUN yarn install --non-interactive --ignore-scripts

# -------------------------
# dev (runtime-only)
# -------------------------
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["yarn", "dev"]

# -------------------------
# prod build
# -------------------------
FROM deps AS builder
COPY . .
RUN rm -f prisma.config.ts prisma.config.js prisma.config.mjs || true
RUN npx prisma generate --schema=prisma/schema.prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build --no-lint

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# MUITO IMPORTANTE no seu projeto:
# Prisma Client foi gerado em /app/src/generated/prisma (não em node_modules/.prisma)
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

USER nextjs
EXPOSE 3000
CMD ["yarn", "start"]
