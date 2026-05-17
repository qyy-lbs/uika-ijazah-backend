// src/controllers/unitController.ts
import type { Request, Response } from 'express';
import { getPrisma } from '../lib/prisma.js'; 

const prisma = getPrisma();

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
};

export const getAllUnits = async (req: Request, res: Response) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        prodi: true 
      }
    });
    res.status(200).json(units);
  } catch (error: any) {
    res.status(500).json({
      message: 'Gagal mengambil data unit',
      error: error.message
    });
  }
};

export const deleteUnits = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({
      where: { id_unit: Number(id) }
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit tidak ditemukan' });
    }

    await prisma.unit.delete({
      where: { id_unit: Number(id) }
    });

    res.status(200).json({ message: 'Unit berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus unit' });
  }
};

export const editUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { jenis_unit, nama_unit, dekan, nidn_dekan, wakil_dekan_1, nidn_wakil_dekan_1 } = req.body;

    const existingUnit = await prisma.unit.findUnique({
      where: { id_unit: Number(id) }
    });

    if (!existingUnit) {
      return res.status(404).json({ message: 'Unit tidak ditemukan' });
    }

    const updatedUnit = await prisma.unit.update({
      where: { id_unit: Number(id) },
      data: {
        jenis_unit,
        nama_unit,
        dekan,
        nidn_dekan,
        wakil_dekan_1,
        nidn_wakil_dekan_1
      }
    });

    res.status(200).json({ message: 'Unit berhasil diupdate', data: updatedUnit });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate unit' });
  }
};

// ==================== PRODI ====================

export const createProdi = async (req: Request, res: Response) => {
  try {
    const { id_unit, nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, file_paraf_kaprodi, no_sk_akreditasi } = req.body;

    if (!id_unit || !nama_prodi) {
      return res.status(400).json({ message: 'id_unit dan nama_prodi wajib diisi' });
    }

    const unit = await prisma.unit.findUnique({
      where: { id_unit: Number(id_unit) }
    });

    if (!unit) {
      return res.status(404).json({ message: 'Unit tidak ditemukan' });
    }

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
          select: { id_unit: true, nama_unit: true, jenis_unit: true }
        }
      }
    });

    res.status(201).json({ message: 'Prodi berhasil dibuat', data: prodi });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Prodi dengan nama tersebut sudah terdaftar di unit ini' });
    }
    res.status(500).json({ message: 'Gagal membuat prodi', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const getProdiByUnit = async (req: Request, res: Response) => {
  try {
    const { id_unit } = req.params;
    const prodiList = await prisma.prodi.findMany({
      where: { id_unit: Number(id_unit) },
      orderBy: { nama_prodi: 'asc' }
    });
    res.status(200).json({ message: 'Data prodi berhasil diambil', prodiList });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data prodi' });
  }
};

export const editProdi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, file_paraf_kaprodi, no_sk_akreditasi } = req.body;

    const existingProdi = await prisma.prodi.findUnique({
      where: { id_prodi: Number(id) }
    });

    if (!existingProdi) {
      return res.status(404).json({ message: 'Prodi tidak ditemukan' });
    }

    const updatedProdi = await prisma.prodi.update({
      where: { id_prodi: Number(id) },
      data: {
        nama_prodi,
        nama_prodi_en,
        kaprodi,
        nidn_kaprodi,
        file_paraf_kaprodi,
        no_sk_akreditasi,
        updated_at: new Date()
      }
    });

    res.status(200).json({ message: 'Prodi berhasil diupdate', data: updatedProdi });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengupdate prodi' });
  }
};