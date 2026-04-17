import {getPrisma} from '../prisma.js'
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';




export const login = async (req: Request, res: Response) => {
  
  const prisma = new PrismaClient();
  try {
    const { username, password } = req.body;

    // 1. Cari user di database berdasarkan username
    const user = await prisma.users.findUnique({ where: { username } });
    if (!user) {
      // Ingat: dalam Express+TypeScript ESM, jangan return res.status(...)
      // Cukup panggil res.status(...) lalu biarkan fungsi selesai
      res.status(401).json({ message: 'Username atau Password salah' });
      return; 
    }

    // 2. Cek Password (Sementara kita pakai !== karena data di DB belum di-hash)
    if (password !== user.password) {
       res.status(401).json({ message: 'Username atau Password salah' });
       return;
    }

    // 3. Buat Karcis (JWT)
    const token = jwt.sign(
      { id: user.id_user, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' } // Karcis berlaku 1 hari
    );

    // 4. Kirim balasan sukses
    res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      user: { nama: user.nama, role: user.role }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};