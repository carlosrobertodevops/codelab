# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV NODE_ENV=development
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1

# =========================
# deps (install SEM scripts)
# =========================
FROM base AS deps
RUN corepack enable
COPY package.json yarn.lock ./
# IMPORTANTE:
# seu package.json tem "postinstall" que roda Prisma.
# No estágio deps ainda não existe prisma/schema.prisma, então o postinstall falha.
RUN yarn install --non-interactive --ignore-scripts

# =========================
# dev (para docker-compose DEV)
# =========================
FROM base AS dev
ENV NODE_ENV=production
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
# Em DEV o compose sobrescreve command, e geralmente fazemos bind-mount do código.
CMD ["sh", "-c", "yarn dev -H 0.0.0.0 -p 3000"]

# =========================
# builder (PROD)
# =========================
FROM base AS builder
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove client gerado do host (normalmente mac/win) para não contaminar o build Linux
RUN rm -rf src/generated/prisma || true

# Se existir prisma.config.*, evita interferência (você já teve erro de parse nele)
RUN rm -f prisma.config.ts prisma.config.js prisma.config.mjs || true

# Gera Prisma Client (Linux)
RUN npx prisma generate --schema=prisma/schema.prisma

# MUITO IMPORTANTE (output custom):
# Seu client é importado de src/generated/prisma, então o engine precisa existir relativo a esse output.
# Copiamos o engine para src/generated/prisma/.prisma/client
RUN if [ -d node_modules/.prisma/client ]; then \
  mkdir -p src/generated/prisma/.prisma/client && \
  cp -R node_modules/.prisma/client/* src/generated/prisma/.prisma/client/ ; \
  fi

# Build Next
ENV NEXT_DISABLE_ESLINT=1
RUN yarn build --no-lint

# =========================
# runner (PROD)
# =========================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node -e \"console.log('Prisma migrate deploy OK')\" && yarn start"]
