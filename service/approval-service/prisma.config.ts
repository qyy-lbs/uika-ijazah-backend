import { defineConfig } from '@prisma/config';
import 'dotenv/config'; // Memaksa Prisma CLI untuk membaca file .env

export default defineConfig({
  // Dibutuhkan untuk Prisma Studio dan Client
  datasource: {
    url: process.env.DATABASE_URL,
  },
  // Dibutuhkan untuk Prisma Migrate / Push
  migrations: {
    path: process.env.DATABASE_URL,
  },
});