# Tahap 1: Build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build


# Tahap 2: Run Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install --omit=dev

# Copy hasil generate Prisma dari builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy hasil build
COPY --from=builder /app/dist ./dist

EXPOSE 3005

CMD ["node", "dist/server.js"]