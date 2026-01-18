# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

ENV NEXT_TELEMETRY_DISABLED=1

# =========================
# deps (instala COM devDependencies)
# =========================
FROM base AS deps
# FORÇA ambiente de build como development para não cortar devDependencies
ENV NODE_ENV=development
ENV YARN_PRODUCTION=false
ENV npm_config_production=false

COPY package.json yarn.lock ./
RUN rm -f package-lock.json

# instala deps sem rodar postinstall (seu postinstall roda prisma e pode falhar aqui)
RUN yarn install --non-interactive --frozen-lockfile --ignore-scripts

# =========================
# builder
# =========================
FROM base AS builder
# mantém build como development para garantir toolchain completa
ENV NODE_ENV=development
ENV YARN_PRODUCTION=false
ENV npm_config_production=false

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# evita interferência de prisma.config.* (você já teve problemas com isso)
RUN rm -f prisma.config.ts prisma.config.js prisma.config.mjs || true

# gera Prisma Client (output custom em src/generated/prisma)
RUN yarn prisma:generate

# build Next
RUN yarn build

# =========================
# runner (runtime)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/yarn.lock ./yarn.lock
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && yarn start"]
