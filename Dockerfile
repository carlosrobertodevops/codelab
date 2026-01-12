# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
# Importante: não executar postinstall (que roda prisma migrate/generate)
RUN yarn install --non-interactive --ignore-scripts


FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client com Prisma v7 (usando prisma.config.ts + prisma/schema.prisma)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

# Evita falhar por lint em build Docker
RUN yarn build --no-lint


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apk add --no-cache libc6-compat openssl

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Prisma client gerado no path definido no schema (../src/generated/prisma),
# mas em runtime o Next já foi buildado; ainda assim mantemos o diretório.
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 3000

CMD ["yarn", "start"]
