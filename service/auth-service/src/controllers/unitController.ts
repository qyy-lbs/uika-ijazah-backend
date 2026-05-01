import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const createUnit = async (req: Request, res: Response) => {
  try {
    console.log("🔥 ISI PAKET DARI POSTMAN:", req.body);
    const { nama_unit, jenis_unit, rektor, dekan } = req.body;

    const unit = await prisma.unit.create({
      data: {
        nama_unit,
        jenis_unit,
        rektor,
        dekan
      },
    });

    res.status(201).json({ message: 'Unit berhasil dibuat', data: unit });
  } catch (error: any) {
    // 2. KITA BONGKAR DETAIL ERROR-NYA KE TERMINAL & POSTMAN
    console.error("🚨 DETAIL ERROR PRISMA:", error.message);
    
    res.status(500).json({ 
      message: 'Gagal membuat unit', 
      detail_error: error.message // <--- Ini yang akan menunjukkan letak salahnya!
    });
  }
}

export const getAllUnits = async (req: Request, res: Response) => {
  try {
    const units = await prisma.unit.findMany();
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data unit', error });
  }
};