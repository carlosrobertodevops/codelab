# Build
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable

# Copia manifests
COPY package.json yarn.lock ./

# IMPORTANTE:
# Evita rodar postinstall (onde seu projeto chama prisma migrate deploy)
RUN yarn install --frozen-lockfile --ignore-scripts

# Agora copia o restante (inclui prisma/schema.prisma)
COPY . .

# Gera Prisma Client (não precisa de banco)
RUN npx prisma generate

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

# Copia o necessário para rodar
COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

CMD ["yarn", "start"]
