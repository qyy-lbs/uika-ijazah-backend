import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export const getPrisma = () => {
  if (!prisma) {
    // Prisma baru akan dibuat saat fungsi ini dipanggil pertama kali
    prisma = new PrismaClient();
  }
  return prisma;
};