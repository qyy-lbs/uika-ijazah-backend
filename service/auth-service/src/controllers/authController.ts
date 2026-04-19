import type { Request, Response } from 'express';
import { getPrisma } from '../lib/prisma.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();

  try {
    const { email, password } = req.body;

    // 1. Validasi Input Kosong
    if (!email || !password) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Username dan password wajib diisi!' 
      });
      return;
    }

    // 2. Cari User di Database
    const user = await prisma.users.findUnique({ 
      where: { email } 
    });





    if (!user) {
      res.status(401).json({ status: 'error', message: 'Kredensial tidak valid!' });
      return;
    }

    // 3. Verifikasi Password Menggunakan Bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password as string);
    if (!isPasswordValid) {
      res.status(401).json({ status: 'error', message: 'Kredensial tidak valid!' });
      return;
    }

    // last login
    await prisma.users.update({
      where: { id_user: user.id_user },
      data: { last_login: new Date() } // Mencatat jam & tanggal detik ini
    });


    // 4. Generate JWT Token (Karcis)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET belum dikonfigurasi di file .env');
    }

    const token = jwt.sign(
      { 
        id_user: user.id_user, 
        role: user.role, 
        id_unit: user.id_unit // untuk filter per fakultas 
      }, 
      jwtSecret, 
      { expiresIn: '8h' } 
    );


    // 5. Kirim Balasan Sukses
    res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      data: {
        id_user: user.id_user,
        email: user.email,
        nama: user.nama,
        role: user.role,
        id_unit: user.id_unit
      }
    });

  } catch (error) {
    console.error('[AUTH ERROR]:', error);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
  }
};