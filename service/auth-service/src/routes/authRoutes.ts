import { Router } from 'express';
import { login } from '../controllers/authController.js';
// 1. Import authorizeRoles yang baru kita buat
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: 'error', message: 'Terlalu banyak percobaan login.' }
});

// PINTU DEPAN (Publik)
router.post('/login', loginLimiter, login);

// PINTU DALAM 1: Area Rahasia (Hanya cek Token, semua role boleh masuk)
router.get('/profile', verifyToken, (req: AuthRequest, res) => {
  res.status(200).json({ status: 'success', message: 'Anda berhasil masuk ke profil.', data: req.user });
});

// ---------------------------------------------------------
// PINTU DALAM 2: Area Khusus Admin (Cek Token + Cek Jabatan)
// ---------------------------------------------------------
router.get('/dashboard-admin', verifyToken, authorizeRoles('admin'), (req: AuthRequest, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Selamat datang, Bos! Ini ruangan khusus Admin.' 
  });
});

// ---------------------------------------------------------
// PINTU DALAM 3: Area Khusus Mahasiswa (Cek Token + Cek Jabatan)
// ---------------------------------------------------------
router.get('/dashboard-mahasiswa', verifyToken, authorizeRoles('mahasiswa'), (req: AuthRequest, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Halo Mahasiswa, ini nilai-nilai Anda.' 
  });
});

export default router;