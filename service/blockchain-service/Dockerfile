# Tahap 1: Build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build


# Tahap 2: Run Production
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3011

CMD ["node", "dist/server.js"]