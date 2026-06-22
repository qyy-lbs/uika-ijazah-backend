import type { Request, Response } from 'express';
import * as unitService from '../services/unit.service.js';

// ==================== UNIT ====================

export const createUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    // KITA GABUNGKAN TEKS & FILE DI SINI
    // Multer sudah memparsing FormData ke dalam req.body dan req.files
    const data = {
      ...req.body,
      files: req.files // Mengirim array/objek file ke service
    };

    const unit = await unitService.createUnit(data);
    res.status(201).json({ message: 'Unit berhasil dibuat', data: unit });
  } catch (error: any) {
    console.error('Error create unit:', error);
    res.status(500).json({ 
      message: 'Gagal membuat unit',
      error: error.message 
    });
  }
};

export const getAllUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const units = await unitService.getAllUnits();
    res.status(200).json(units);
  } catch (error: any) {
    res.status(500).json({
      message: 'Gagal mengambil data unit',
      error: error.message
    });
  }
};

export const deleteUnits = async (req: any, res: Response): Promise<void> => {
  try {
    const deletedBy =
      Number(req.user?.id_user || req.user?.id || 0) || null;

    await unitService.deleteUnit(req.params.id as string, deletedBy);

    res.status(200).json({
      message: "Unit berhasil dihapus",
    });
  } catch (error: any) {
    const message = error.message || "Gagal menghapus unit";

    const statusCode =
      message.toLowerCase().includes("tidak ditemukan")
        ? 404
        : 400;

    res.status(statusCode).json({
      message,
    });
  }
};

export const restoreUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const restoredUnit = await unitService.restoreUnit(req.params.id as string);

    res.status(200).json({
      message: "Unit berhasil direstore",
      data: restoredUnit,
    });
  } catch (error: any) {
    const message = error.message || "Gagal restore unit";

    const statusCode =
      message.includes("tidak ditemukan")
        ? 404
        : 400;

    res.status(statusCode).json({
      message,
    });
  }
};

export const editUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔥 WAJIB: Gabungkan body dan files seperti pada createUnit!
    const payload = {
      ...req.body,
      files: req.files 
    };

    const updatedUnit = await unitService.editUnit(req.params.id as string, payload);
    res.status(200).json({ message: 'Unit berhasil diupdate', data: updatedUnit });
} catch (error: any) {
  console.error("Error edit unit:", error);

  const message = error.message || "Gagal mengupdate unit";

  const statusCode =
    message.includes("tidak ditemukan")
      ? 404
      : 400;

  res.status(statusCode).json({
    message,
  });

  return;
}
};

// ==================== PRODI ====================

export const createProdi = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔥 PENGAMAN 1: Jika req.body undefined, paksa menjadi objek kosong {} agar aplikasi tidak meledak
    const payload = {
      ...(req.body || {}),
      files: req.files
    };

    const newProdi = await unitService.createProdi(payload);
    
    res.status(201).json({ message: 'Prodi berhasil dibuat', data: newProdi });
    return; // PENTING: Hentikan eksekusi setelah sukses

  } catch (error: any) {
    console.error("🚨 ALARM! ERROR CREATE PRODI:", error);

    // Filter jika file bukan PNG
    if (error.message === 'FORMAT_TIDAK_SAH') {
      res.status(400).json({ message: 'Gagal! Hanya file berformat PNG yang diperbolehkan.' });
      return; // 🔥 PENGAMAN 2: WAJIB ADA RETURN agar tidak terjadi ERR_HTTP_HEADERS_SENT
    }

    // Error umum lainnya
    res.status(500).json({ 
      message: 'Gagal membuat prodi', 
      error: error.message 
    });
    return; // PENTING: Hentikan eksekusi
  }
};

export const getProdiByUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const prodiList = await unitService.getProdiByUnit(req.params.id_unit as string);
    res.status(200).json({ message: 'Data prodi berhasil diambil', prodiList });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data prodi' });
  }
};

export const editProdi = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = {
      ...(req.body || {}),
      files: req.files,
    };

    console.log("[editProdi] body:", req.body);
    console.log("[editProdi] files:", req.files);

    const updatedProdi = await unitService.editProdi(
      req.params.id as string,
      payload,
    );

    res.status(200).json({
      message: "Prodi berhasil diupdate",
      data: updatedProdi,
    });

    return;
  } catch (error: any) {
    console.error("Error edit prodi:", error);

    const statusCode = error.message === "Prodi tidak ditemukan" ? 404 : 500;

    res.status(statusCode).json({
      message: error.message || "Gagal mengupdate prodi",
    });

    return;
  }
};


export const deleteProdi = async (req: any, res: Response): Promise<void> => {
  try {
    const deletedBy =
      Number(req.user?.id_user || req.user?.id || 0) || null;

    await unitService.deleteProdi(req.params.id as string, deletedBy);

    res.status(200).json({
      message: "Prodi berhasil dihapus",
    });
  } catch (error: any) {
    const message = error.message || "Gagal menghapus prodi";

    const statusCode =
      message.toLowerCase().includes("tidak ditemukan")
        ? 404
        : 400;

    res.status(statusCode).json({
      message,
    });
  }
};


export const restoreProdi = async (req: Request, res: Response): Promise<void> => {
  try {
    const restoredProdi = await unitService.restoreProdi(req.params.id as string);

    res.status(200).json({
      message: "Prodi berhasil direstore",
      data: restoredProdi,
    });
  } catch (error: any) {
    const message = error.message || "Gagal restore prodi";

    const statusCode =
      message.toLowerCase().includes("tidak ditemukan")
        ? 404
        : 400;

    res.status(statusCode).json({
      message,
    });
  }
};