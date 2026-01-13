# syntax=docker/dockerfile:1

# =========================
# deps
# =========================
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
# Evita scripts no install (especialmente prisma/migrate) durante build
RUN yarn install --non-interactive --ignore-scripts


# =========================
# builder
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args (para build do Next e Prisma)
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
ARG CLOUDFLARE_ACCOUNT_ID=""
ARG CLOUDFLARE_ACCESS_ID=""
ARG CLOUDFLARE_ACCESS_KEY=""
ARG CLOUDFLARE_R2_BUCKET_NAME=""
ARG CLOUDFLARE_FILE_BASE_PATH=""
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ARG CLERK_SECRET_KEY=""
ARG CLERK_WEBHOOK_SECRET=""
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/signin"
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/signup"
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
ARG ASAAS_API_KEY=""
ARG ASAAS_API_URL=""
ARG ASAAS_WEBHOOK_TOKEN=""

ENV DATABASE_URL=${DATABASE_URL}
ENV CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
ENV CLOUDFLARE_ACCESS_ID=${CLOUDFLARE_ACCESS_ID}
ENV CLOUDFLARE_ACCESS_KEY=${CLOUDFLARE_ACCESS_KEY}
ENV CLOUDFLARE_R2_BUCKET_NAME=${CLOUDFLARE_R2_BUCKET_NAME}
ENV CLOUDFLARE_FILE_BASE_PATH=${CLOUDFLARE_FILE_BASE_PATH}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK_SECRET}
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL}
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
ENV ASAAS_API_KEY=${ASAAS_API_KEY}
ENV ASAAS_API_URL=${ASAAS_API_URL}
ENV ASAAS_WEBHOOK_TOKEN=${ASAAS_WEBHOOK_TOKEN}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_DISABLE_ESLINT=1

# Prisma generate (força schema e não tenta config)
RUN npx prisma generate --schema=prisma/schema.prisma

# Build do Next (sem lint)
RUN yarn build --no-lint


# =========================
# runner
# =========================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000

CMD ["yarn", "start"]
