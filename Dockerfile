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

# syntax=docker/dockerfile:1

# FROM node:20-alpine AS base
# WORKDIR /app
# RUN apk add --no-cache libc6-compat openssl
# ENV NEXT_TELEMETRY_DISABLED=1

# # =========================
# # deps
# # =========================
# FROM base AS deps
# RUN corepack enable
# COPY package.json yarn.lock ./
# # Não usar --ignore-scripts aqui para evitar surprises com libs que dependem de postinstall
# RUN yarn install --non-interactive

# # =========================
# # builder
# # =========================
# FROM base AS builder
# RUN corepack enable
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# # Evita Prisma tentar ler prisma.config.ts (quando existe)
# RUN rm -f prisma.config.ts prisma.config.js prisma.config.mjs || true

# # Gera Prisma Client a partir do schema
# RUN npx prisma generate --schema=prisma/schema.prisma

# # Garante que o Query Engine fique onde o Prisma (output custom) procura em runtime
# # (output do client está em src/generated/prisma)
# RUN if [ -d node_modules/.prisma/client ]; then \
#   mkdir -p src/generated/prisma/.prisma/client && \
#   cp -R node_modules/.prisma/client/* src/generated/prisma/.prisma/client/ ; \
#   fi

# # Build do Next (sem lint)
# ENV NEXT_DISABLE_ESLINT=1
# RUN yarn build --no-lint

# # =========================
# # runner
# # =========================
# FROM base AS runner
# ENV NODE_ENV=production
# WORKDIR /app

# RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/yarn.lock ./yarn.lock
# COPY --from=builder /app/node_modules ./node_modules

# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/src/generated ./src/generated

# USER nextjs
# EXPOSE 3000

# # Migrações + start
# CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node -e \"console.log('Prisma migrate deploy OK')\" && yarn start"]
