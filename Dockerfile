# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
# IMPORTANTE: não execute scripts aqui (postinstall prisma etc.)
RUN yarn install --non-interactive --ignore-scripts


FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 7: gera client (não precisa de conexão DB)
RUN npx prisma generate

# Build do Next
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build


FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copia tudo que precisa para runtime
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 3000

CMD ["yarn", "start"]
