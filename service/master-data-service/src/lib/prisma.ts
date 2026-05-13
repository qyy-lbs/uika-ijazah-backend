import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Variabel global untuk menampung koneksi
let prisma: PrismaClient;

/**
 * Menginisialisasi dan mengembalikan instance Prisma Client.
 * Dioptimalkan menggunakan Driver Adapter 'pg' untuk performa koneksi yang stabil.
 * * @returns {PrismaClient} Instance tunggal dari PrismaClient
 */
export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;

    // 1. Fail-Fast Validation: Hentikan eksekusi jika konfigurasi krusial hilang
    if (!connectionString) {
      throw new Error('[DB_CONFIG_ERROR] DATABASE_URL tidak ditemukan di file .env');
    }

    // 2. Konfigurasi Connection Pool (Mencegah database crash karena kelebihan request)
    const pool = new Pool({ 
      connectionString,
      max: 20, // Batas maksimal koneksi simultan
      idleTimeoutMillis: 30000 // Tutup koneksi jika tidak dipakai selama 30 detik
    });
    
    // 3. Bungkus dengan Adapter resmi Prisma
    const adapter = new PrismaPg(pool);
    
    // 4. Instansiasi Prisma Client
    prisma = new PrismaClient({ adapter });
    
    // Log standar server 
    console.info('[PRISMA] Koneksi database berhasil diinisialisasi.');
  }
  
  return prisma;
};