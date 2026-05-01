import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../lib/prisma.js';

const prisma = getPrisma();

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. menerima email dan password
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi!' });
      return;
    }

    // 2. Cari user berdasarkan email
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Akun tidak ditemukan!' });
      return;
    }

    // 3. Cek apakah akun aktif
    if (!user.is_active) {
      res.status(403).json({ status: 'error', message: 'Akun Anda sedang dinonaktifkan. Hubungi Admin.' });
      return;
    }

    // 4. Verifikasi Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ status: 'error', message: 'Email atau Password Salah!' });
      return;
    }

    // 5. Catat waktu Last Login (Update data di DB)
    await prisma.users.update({
      where: { id_user: user.id_user },
      data: { last_login: new Date() }
    });

    // 6. Buat Karcis JWT (Hanya isi dengan data yang ada di tabel)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET belum diatur di .env');

    const token = jwt.sign(
      { 
        id_user: user.id_user, 
        email: user.email, 
        role: user.role, 
        id_unit: user.id_unit 
      },
      jwtSecret,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil!',
      token,
      data: {
        id_user: user.id_user,
        email: user.email,
        role: user.role,
        id_unit: user.id_unit
      }
    });

  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
  }
};