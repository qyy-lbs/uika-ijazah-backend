import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// 1. Buat koneksi Pool menggunakan 'pg' standar
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Bungkus Pool tersebut ke dalam Adapter Prisma
const adapter = new PrismaPg(pool);

// 3. Masukkan adapter ke dalam PrismaClient (Aturan wajib Prisma v7)
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Buat Unit Universitas dulu
  const unitUIKA = await prisma.unit.create({
    data: {
      nama_unit: 'Universitas Ibn Khaldun Bogor',
      jenis_unit: 'universitas',
      rektor: 'Nama Rektor Anda',
    }
  });

  // 2. Buat User Admin Utama
  const admin = await prisma.users.upsert({
    where: { email: 'admin@uika.ac.id' },
    update: {},
    create: {
      email: 'admin@uika.ac.id',
      password: hashedPassword,
      role: 'admin',
      id_unit: unitUIKA.id_unit,
      is_active: true
    },
  });

  console.log('✅ Berhasil membuat unit dan admin pertama:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Tutup koneksi dengan rapi
    await prisma.$disconnect();
    await pool.end();
  });