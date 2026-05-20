import type { Request, Response } from 'express';
import * as unitService from '../services/unit.service.js';

// ==================== UNIT ====================

export const createUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const unit = await unitService.createUnit(req.body);
    res.status(201).json({ message: 'Unit berhasil dibuat', data: unit });
  } catch (error: any) {
    console.error('Error create unit:', error);
    res.status(500).json({ 
      message: 'Gagal membuat unit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

export const deleteUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    await unitService.deleteUnit(req.params.id as string);
    res.status(200).json({ message: 'Unit berhasil dihapus' });
  } catch (error: any) {
    const statusCode = error.message === 'Unit tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ message: error.message || 'Gagal menghapus unit' });
  }
};

export const editUnit = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedUnit = await unitService.editUnit(req.params.id as string, req.body);
    res.status(200).json({ message: 'Unit berhasil diupdate', data: updatedUnit });
  } catch (error: any) {
    const statusCode = error.message === 'Unit tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ message: error.message || 'Gagal mengupdate unit' });
  }
};

// ==================== PRODI ====================

export const createProdi = async (req: Request, res: Response): Promise<void> => {
  try {
    const prodi = await unitService.createProdi(req.body);
    res.status(201).json({ message: 'Prodi berhasil dibuat', data: prodi });
  } catch (error: any) {
    if (error.message.includes('wajib diisi')) {
      res.status(400).json({ message: error.message });
      return;
    }
    if (error.message === 'Unit tidak ditemukan') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.message.includes('sudah terdaftar')) {
      res.status(409).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Gagal membuat prodi', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
    const updatedProdi = await unitService.editProdi(req.params.id as string, req.body);
    res.status(200).json({ message: 'Prodi berhasil diupdate', data: updatedProdi });
  } catch (error: any) {
    const statusCode = error.message === 'Prodi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ message: error.message || 'Gagal mengupdate prodi' });
  }
};