import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/authMiddleware.js';


//Controller: Profil Umum
export const getProfile = (req: AuthRequest, res: Response): void => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Data profil berhasil diambil.', 
    data: req.user 
  });
};


//Controller: Dashboard Level Universitas (Rektorat)
export const getRektoratDashboard = (req: AuthRequest, res: Response): void => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Selamat datang di Dashboard Rektorat.',
    akses: 'Level Universitas',
    user_aktif: req.user?.role
  });
};


//Controller: Dashboard Level Fakultas
export const getFakultasDashboard = (req: AuthRequest, res: Response): void => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Selamat datang di Dashboard Fakultas.',
    akses: 'Level Fakultas',
    user_aktif: req.user?.role
  });
};


//Controller: Dashboard Operasional (Operator Data)
export const getOperasionalDashboard = (req: AuthRequest, res: Response): void => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Selamat datang di Ruang Kerja Operator.',
    akses: 'Level Operasional',
    user_aktif: req.user?.role
  });
};