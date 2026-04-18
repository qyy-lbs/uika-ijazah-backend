import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

let prisma: PrismaClient;

export const getPrisma = () => {
  if (!prisma) {
    if (!process.env.DATABASE_URL) {
      console.error("🚨 FATAL ERROR: DATABASE_URL tidak ditemukan!");
    } else {
      console.log("✅ DATABASE_URL berhasil dibaca sistem.");
    }

    // 1. Buat kolam koneksi (Pool) menggunakan library 'pg' asli
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 2. Bungkus dengan Adapter resmi Prisma 7
    const adapter = new PrismaPg(pool);
    
    // 3. Nyalakan Prisma dengan Adapter tersebut
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
};