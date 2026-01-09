# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Enable Yarn via Corepack
RUN corepack enable

# Copy manifests first to leverage Docker layer caching
COPY package.json yarn.lock ./

# IMPORTANT:
# - This project runs Prisma commands in "postinstall".
# - During Docker build we avoid running scripts to prevent DB-dependent commands from breaking the build.
RUN yarn install --frozen-lockfile --ignore-scripts

# Copy source code (includes prisma/schema.prisma)
COPY . .

# Generate Prisma Client (does not require DB connectivity)
RUN npx prisma generate

# Build Next.js
RUN yarn build


# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

# Copy runtime essentials
COPY --from=build /app/package.json /app/yarn.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

CMD ["yarn", "start"]
