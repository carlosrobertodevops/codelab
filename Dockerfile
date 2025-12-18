# Usa imagem Node LTS
FROM node:20-alpine AS build

# Cria diretório de trabalho
WORKDIR /app

# Copia pacotes e instala dependências (cache mais eficiente)
COPY package.json package-lock.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Build da aplicação Next.js
RUN npm run build

# Produção: imagem leve
FROM node:20-alpine AS runner

WORKDIR /app

# Apenas arquivos necessários para rodar
COPY package.json package-lock.json ./
RUN npm ci --production

# Copia build
COPY --from=build /app/.next .next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

# Porta que Next.js irá expor
ENV PORT=3000
EXPOSE 3000

# Start da aplicação
CMD ["npm", "run", "start"]
