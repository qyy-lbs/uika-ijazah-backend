// controllers/unitController.ts
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==================== UNIT ====================

export const createUnit = async (req: Request, res: Response) => {
  try {
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
    console.error('Error create unit:', error);
    res.status(500).json({ 
      message: 'Gagal membuat unit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const getAllUnits = async (req: Request, res: Response) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        prodi: true // Opsional: ikutkan daftar prodi di setiap unit
      }
    });
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data unit', error });
  }
};

export const deleteUnits = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

     const unit = await prisma.unit.findUnique({
      where: { id_unit: Number(id) }
    });

    if (!unit) {
      return res.status(404).json({
        message: 'Unit tidak ditemukan',
      });
    }

    // hapus unit
    await prisma.unit.delete({
      where: { id_unit: Number(id) }
    });

    res.status(200).json({
      message: 'Unit berhasil dihapus',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal menghapus unit',
    });
  }
};

export const editUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      jenis_unit,
      nama_unit,
      dekan,
      nidn_dekan,
      wakil_dekan_1,
      nidn_wakil_dekan_1
    } = req.body;

    // cek apakah unit ada
    const existingUnit = await prisma.unit.findUnique({
      where: {
        id_unit: Number(id)
      }
    });

    if (!existingUnit) {
      return res.status(404).json({
        message: 'Unit tidak ditemukan'
      });
    }

    // update unit
    const updatedUnit = await prisma.unit.update({
      where: {
        id_unit: Number(id)
      },
      data: {
        jenis_unit,
        nama_unit,
        dekan,
        nidn_dekan,
        wakil_dekan_1,
        nidn_wakil_dekan_1
      }
    });

    res.status(200).json({
      message: 'Unit berhasil diupdate',
      data: updatedUnit
    });

  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengupdate unit'
    });
  }
};

// ==================== PRODI (dalam Unit) ====================

export const createProdi = async (req: Request, res: Response) => {
  try {
    const {
      id_unit,
      nama_prodi,
      nama_prodi_en,
      kaprodi,
      nidn_kaprodi,
      file_paraf_kaprodi,
      no_sk_akreditasi
    } = req.body;

    // 1️⃣ Validasi input wajib
    if (!id_unit || !nama_prodi) {
      return res.status(400).json({
        message: 'id_unit dan nama_prodi wajib diisi'
      });
    }

    // 2️⃣ Cek apakah unit tujuan ada
    const unit = await prisma.unit.findUnique({
      where: { id_unit: Number(id_unit) }
    });

    if (!unit) {
      return res.status(404).json({
        message: 'Unit tidak ditemukan'
      });
    }

    // 3️⃣ Buat prodi baru dengan relasi ke unit
    const prodi = await prisma.prodi.create({
      data: {
        id_unit: Number(id_unit),
        nama_prodi,
        nama_prodi_en,
        kaprodi,
        nidn_kaprodi,
        file_paraf_kaprodi,
        no_sk_akreditasi
      },
      include: {
        unit: {
          select: {
            id_unit: true,
            nama_unit: true,
            jenis_unit: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Prodi berhasil dibuat',
      data: prodi
    });

  } catch (error: any) {
    console.error('Error create prodi:', error);
    
    // Handle unique constraint error dari Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Prodi dengan nama tersebut sudah terdaftar di unit ini'
      });
    }

    res.status(500).json({
      message: 'Gagal membuat prodi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Opsional: Get semua prodi by unit
export const getProdiByUnit = async (req: Request, res: Response) => {
  try {
    const { id_unit } = req.params;

    const prodiList = await prisma.prodi.findMany({
      where: { id_unit: Number(id_unit) },
      orderBy: { nama_prodi: 'asc' }
    });

    res.status(200).json({
      message: 'Data prodi berhasil diambil',
       prodiList
    });

  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengambil data prodi',
      error
    });
  }
};