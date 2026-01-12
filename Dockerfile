# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
# Importante: --ignore-scripts para NÃO rodar postinstall (prisma migrate/generate) durante o install
RUN yarn install --non-interactive --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

## Prisma 7: config + schema + generate
## Durante o build nem sempre existe DATABASE_URL no ambiente.
## Como o prisma.config.ts lê process.env.DATABASE_URL, garantimos um valor default aqui.
ARG DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres?schema=public"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

# Build do Next (desabilita ESLint no build para não travar imagem por regra/lint)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=1

RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.* ./ 2>/dev/null || true
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Sobe o app. O docker-compose já injeta DATABASE_URL.
CMD ["yarn", "start"]
