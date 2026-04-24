import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. KITA BUAT TIPE REQUEST SENDIRI (Mewarisi Express Request)
// Alih-alih memaksa Express mengubah Request bawaannya, kita bikin versi kita sendiri.
export interface CustomRequest extends Request {
  user?: {
    id_user: number;
    email: string;
    role: string;
    id_unit: number | null;
  };
}

// 2. GUNAKAN CustomRequest DI SINI (Bukan Request biasa)
export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    res.status(403).json({ status: 'error', message: 'Akses ditolak. Token tidak disediakan.' });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET hilang');

    // Dekode token dan pastikan formatnya sesuai
    const decoded = jwt.verify(token, jwtSecret) as NonNullable<CustomRequest['user']>;
    
    // TIDAK AKAN ERROR KARENA req ADALAH CustomRequest
    req.user = decoded; 
    
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.' });
  }
};

// 3. GUNAKAN CustomRequest DI SINI JUGA
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    
    if (!req.user || !req.user.role) {
      res.status(403).json({ status: 'error', message: 'Akses ditolak. Identitas tidak lengkap.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        status: 'error', 
        message: `Akses ditolak. Jabatan '${req.user.role}' tidak memiliki wewenang untuk area ini.` 
      });
      return;
    }

    next();
  };
};