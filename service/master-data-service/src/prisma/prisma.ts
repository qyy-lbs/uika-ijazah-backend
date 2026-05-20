import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient;

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('[DB_CONFIG_ERROR] DATABASE_URL tidak ditemukan');
    }

    const pool = new Pool({ 
      connectionString,
      max: 20, 
      idleTimeoutMillis: 30000 
    });
    
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
    console.info('[PRISMA] Koneksi database master berhasil diinisialisasi.');
  }
  return prisma;
};