# =========================
# Stage 1 — deps
# =========================
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --non-interactive --ignore-scripts


# =========================
# Stage 2 — builder
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=1

# ❗ NÃO roda Prisma aqui
RUN yarn build


# =========================
# Stage 3 — runner
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3000

# ✅ Prisma roda AQUI, já com DATABASE_URL
CMD sh -c "npx prisma migrate deploy && npx prisma generate && yarn start"
