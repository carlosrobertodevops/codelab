# syntax=docker/dockerfile:1

############################
# deps
############################
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
# ignora scripts porque seu projeto roda prisma migrate/generate no postinstall
RUN yarn install --non-interactive --ignore-scripts


############################
# builder
############################
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove qualquer prisma.config.* para evitar parsing indevido em build
RUN rm -f prisma.config.ts prisma.config.js prisma.config.mjs || true

# ========= Build args vindos do compose =========
ARG DATABASE_URL
ARG CLOUDFLARE_ACCOUNT_ID
ARG CLOUDFLARE_ACCESS_ID
ARG CLOUDFLARE_ACCESS_KEY
ARG CLOUDFLARE_R2_BUCKET_NAME
ARG CLOUDFLARE_FILE_BASE_PATH

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG CLERK_WEBHOOK_SECRET
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

ARG ASAAS_API_KEY
ARG ASAAS_API_URL
ARG ASAAS_WEBHOOK_TOKEN

# Exporta para o ambiente de build (o Next pode ler isso durante build)
ENV DATABASE_URL=$DATABASE_URL
ENV CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID
ENV CLOUDFLARE_ACCESS_ID=$CLOUDFLARE_ACCESS_ID
ENV CLOUDFLARE_ACCESS_KEY=$CLOUDFLARE_ACCESS_KEY
ENV CLOUDFLARE_R2_BUCKET_NAME=$CLOUDFLARE_R2_BUCKET_NAME
ENV CLOUDFLARE_FILE_BASE_PATH=$CLOUDFLARE_FILE_BASE_PATH

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV CLERK_WEBHOOK_SECRET=$CLERK_WEBHOOK_SECRET
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

ENV ASAAS_API_KEY=$ASAAS_API_KEY
ENV ASAAS_API_URL=$ASAAS_API_URL
ENV ASAAS_WEBHOOK_TOKEN=$ASAAS_WEBHOOK_TOKEN

# Prisma generate (não precisa conectar no DB, só precisa de DATABASE_URL válido)
RUN npx prisma generate --schema=prisma/schema.prisma

# Build do Next (sem lint)
ENV NEXT_DISABLE_ESLINT=1
RUN yarn build --no-lint


############################
# runner
############################
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copia manifests
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# CRÍTICO: copiar node_modules DO builder (contém .prisma/client + engines)
COPY --from=builder /app/node_modules ./node_modules

# Copia artefatos Next
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Prisma schema/migrations para migrate deploy em runtime
COPY --from=builder /app/prisma ./prisma

# Se seu prisma client é gerado em src/generated, mantém no runtime
COPY --from=builder /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000
CMD ["yarn", "start"]

# FROM node:20-alpine AS deps
# WORKDIR /app

# RUN apk add --no-cache libc6-compat openssl
# RUN corepack enable

# COPY package.json yarn.lock ./
# # Importante: ignora scripts (porque seu postinstall roda migrate deploy)
# RUN yarn install --non-interactive --ignore-scripts


# FROM node:20-alpine AS builder
# WORKDIR /app

# RUN apk add --no-cache libc6-compat openssl
# RUN corepack enable

# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# # Se existir prisma.config.* em algum momento, removemos para evitar parsing indevido
# RUN rm -f prisma.config.ts prisma.config.js prisma.config.mjs || true

# # Prisma generate NÃO precisa conectar no banco, mas precisa de DATABASE_URL válido sintaticamente.
# ARG DATABASE_URL_BUILD="postgresql://codelab:codelab_dev_password@db:5432/codelab?schema=public"
# ENV DATABASE_URL=$DATABASE_URL_BUILD

# RUN npx prisma generate --schema=prisma/schema.prisma

# # (Opcional) desabilita lint no build
# ENV NEXT_DISABLE_ESLINT=1

# RUN yarn build --no-lint


# FROM node:20-alpine AS runner
# WORKDIR /app

# ENV NODE_ENV=production

# RUN apk add --no-cache libc6-compat openssl
# RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# # Copia manifests
# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/yarn.lock ./yarn.lock

# # CRÍTICO: copia node_modules DO BUILDER (já contém .prisma/client e engines)
# COPY --from=builder /app/node_modules ./node_modules

# # Artefatos do Next
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public

# # Prisma schema/migrations (runtime: migrate deploy)
# COPY --from=builder /app/prisma ./prisma

# # Seu prisma client gera em src/generated/prisma (conforme schema.prisma)
# COPY --from=builder /app/src/generated ./src/generated

# USER nextjs

# EXPOSE 3000
# CMD ["yarn", "start"]
