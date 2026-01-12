# # Build stage
# FROM node:20-alpine AS build

# WORKDIR /app
# RUN corepack enable

# COPY package.json yarn.lock ./
# # RUN yarn install --frozen-lockfile --ignore-scripts
# RUN yarn install

# COPY . .
# # Prevent "DATABASE_URL not found" if ANY build-time code path touches Prisma
# # (this is only for the build step; runtime uses .env via docker-compose)
# ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
# RUN npx prisma generate
# RUN yarn build

# # Runtime stage
# FROM node:20-alpine AS runner

# WORKDIR /app
# RUN corepack enable
# RUN npm install -g npm@11.7.0

# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1
# ENV PORT=3000

# EXPOSE 3000

# COPY --from=build /app/package.json /app/yarn.lock ./
# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/.next ./.next
# COPY --from=build /app/public ./public
# COPY --from=build /app/prisma ./prisma
# COPY --from=build /app/src/generated ./src/generated

# # CMD ["yarn", "start"]
# CMD ["sh", "-c", "yarn prisma:migrate:deploy && yarn prisma:generate && yarn build && yarn start"]

FROM node:20-alpine

WORKDIR /app

# Yarn via corepack
RUN corepack enable

# Copia manifestos primeiro (melhor cache)
COPY package.json yarn.lock ./

# Importante: sem postinstall executando Prisma aqui
RUN yarn install

# Agora copia o restante
COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
