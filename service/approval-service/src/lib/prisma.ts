import { PrismaClient } from '@prisma/client';
import pg from 'pg'; 
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg; 

// Karena 'dotenv/config' sudah dipanggil di index.ts, ini sekarang tidak akan undefined
const connectionString = process.env.DATABASE_URL;

// Buat connection pool dengan tambahan konfigurasi SSL khusus untuk Neon DB
const pool = new Pool({ 
  connectionString,
 max: 10, // Batasi koneksi agar pooler Neon tidak kepenuhan
  connectionTimeoutMillis: 10000, // Beri waktu 10 detik untuk konek
  ssl: {
    rejectUnauthorized: false
  }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;