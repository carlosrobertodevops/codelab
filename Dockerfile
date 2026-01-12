# Build stage
FROM node:20-alpine AS build

WORKDIR /app
RUN corepack enable
RUN npm install -g npm@11.7.0

COPY package.json yarn.lock ./

# Evita postinstall (no seu projeto ele roda prisma migrate/generate)
RUN yarn install --frozen-lockfile --ignore-scripts

COPY . .

# Prevent "DATABASE_URL not found" if ANY build-time code path touches Prisma
# (this is only for the build step; runtime uses .env via docker-compose)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"

# Gera client
RUN npx prisma generate

# Build Next
RUN yarn build


# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
RUN corepack enable
RUN npm install -g npm@11.7.0

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated ./src/generated

CMD ["yarn", "start"]
