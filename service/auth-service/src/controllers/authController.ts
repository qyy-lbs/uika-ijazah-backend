import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../lib/prisma.js';
import type { CustomRequest } from '../middlewares/authMiddleware.js';

const prisma = getPrisma();

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi!' });
      return;
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Akun tidak ditemukan!' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ status: 'error', message: 'Akun Anda sedang dinonaktifkan. Hubungi Admin.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ status: 'error', message: 'Email atau Password Salah!' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!jwtSecret || !refreshSecret) throw new Error('JWT secret belum diatur di .env');

    // Access token 15 menit untuk testing
    const accessToken = jwt.sign(
      { id_user: user.id_user, email: user.email, role: user.role, id_unit: user.id_unit },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Refresh token 1 hari
    const refreshToken = jwt.sign(
      { id_user: user.id_user },
      refreshSecret,
      { expiresIn: '1d' }
    );

    // Simpan refresh token & catat last login
    await prisma.users.update({
      where: { id_user: user.id_user },
      data: {
        last_login: new Date(),
        refresh_token: refreshToken,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil!',
      access_token: accessToken,
      refresh_token: refreshToken,
      data: {
        id_user: user.id_user,
        email: user.email,
        role: user.role,
        id_unit: user.id_unit,
      },
    });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
  }
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
export const logout = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const id_user = req.user?.id_user;

    if (!id_user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized.' });
      return;
    }

    // Hapus refresh token dari database → token lama tidak bisa dipakai lagi
    await prisma.users.update({
      where: { id_user },
      data: { refresh_token: null },
    });

    res.status(200).json({
      status: 'success',
      message: 'Logout berhasil.',
    });
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
  }
};

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ status: 'error', message: 'Refresh token tidak disediakan.' });
      return;
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    if (!refreshSecret || !jwtSecret) throw new Error('JWT secret belum diatur di .env');

    // Verifikasi refresh token
    let decoded: { id_user: number };
    try {
      decoded = jwt.verify(refresh_token, refreshSecret) as { id_user: number };
    } catch {
      res.status(401).json({ status: 'error', message: 'Refresh token tidak valid atau sudah kedaluwarsa.' });
      return;
    }

    // Cek user & cocokkan refresh token di database
    const user = await prisma.users.findUnique({
      where: { id_user: decoded.id_user },
      select: {
        id_user: true,
        email: true,
        role: true,
        id_unit: true,
        is_active: true,
        refresh_token: true,
      },
    });

    if (!user) {
      res.status(401).json({ status: 'error', message: 'User tidak ditemukan.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ status: 'error', message: 'Akun telah dinonaktifkan.' });
      return;
    }

    // Pastikan refresh token cocok dengan yang tersimpan di DB
    if (user.refresh_token !== refresh_token) {
      res.status(401).json({ status: 'error', message: 'Refresh token tidak cocok. Silakan login ulang.' });
      return;
    }

    // Buat access token baru
    const newAccessToken = jwt.sign(
      { id_user: user.id_user, email: user.email, role: user.role, id_unit: user.id_unit },
      jwtSecret,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Access token berhasil diperbarui.',
      access_token: newAccessToken,
    });
  } catch (error) {
    console.error('[REFRESH_TOKEN_ERROR]', error);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
  }
};