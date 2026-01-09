# Build
FROM node:20-alpine AS build
WORKDIR /app

# Habilita Yarn via Corepack (recomendado)
RUN corepack enable

# Copia manifests primeiro (melhora cache)
COPY package.json yarn.lock ./

# Instala deps
RUN yarn install --frozen-lockfile

# Copia o restante do código
COPY . .

# Build do Next
RUN yarn build


# Runtime
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
EXPOSE 3000

# Copia manifests e node_modules do build (inclui prisma CLI via devDeps se necessário)
COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/node_modules ./node_modules

# Copia artefatos necessários
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/next.config.* ./ 2>/dev/null || true

CMD ["yarn", "start"]
