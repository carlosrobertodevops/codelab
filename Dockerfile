# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

# Yarn via Corepack
RUN corepack enable

# Copia apenas manifests para aproveitar cache
COPY package.json yarn.lock ./

# NUNCA rodar scripts no build (evita prisma migrate/seed etc.)
RUN yarn install --non-interactive --ignore-scripts


FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# Necessário para o PrismaConfig (dotenv/config) e para o prisma generate
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres?schema=public"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_docker_placeholder"
ENV CLERK_SECRET_KEY="sk_test_docker_placeholder"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 7+: gera client (não precisa do banco)
RUN npx prisma generate

# Build Next.js (agora sem prerender acessando DB/Clerk)
RUN yarn build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN corepack enable

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
