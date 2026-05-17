import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../lib/prisma.js";

const prisma = getPrisma();

/**
 * Controller: Membuat Akun Baru
 * Akses: Hanya Admin Sistem
 */
export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1. Tangkap data dari request body (Sesuai database terbaru)
    const { email, password, role, id_unit } = req.body;

    // 2. Validasi Input Dasar
    if (!email || !password || !role) {
      res.status(400).json({
        status: "error",
        message: "Email, password, dan role wajib diisi!",
      });
      return;
    }

    // 3. Cek apakah Email sudah terdaftar di database
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        status: "error",
        message: "Gagal! Email tersebut sudah digunakan.",
      });
      return;
    }

    // 4. Enkripsi (Hashing) Password demi keamanan
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Simpan ke Database
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role,
        id_unit: id_unit || null, // id_unit bisa kosong jika dia admin pusat
        is_active: true, // Otomatis aktif saat dibuat
      },
      // Pilih data yang ingin dikembalikan sebagai respons (JANGAN pernah kembalikan password!)
      select: {
        id_user: true,
        email: true,
        role: true,
        id_unit: true,
        is_active: true,
        created_at: true,
      },
    });

    // 6. Berikan balasan sukses
    res.status(201).json({
      status: "success",
      message: "Akun baru berhasil dibuat dan siap digunakan!",
      data: newUser,
    });
  } catch (error) {
    console.error("[USER_CREATE_ERROR]", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server saat membuat akun.",
    });
  }
};

/**
 * Controller: Menampilkan Semua User (Untuk Tabel Dashboard)
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.users.findMany({
      include: { unit: true }, // Menampilkan relasi ke Unit/Fakultas [cite: 27]
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ status: "success", data: users });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Gagal mengambil data." });
  }
};

/**
 * Controller: Menghapus User (Akses: Hanya Admin)
 */
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params; // Menggunakan id_user atau uuid

    await prisma.users.delete({
      where: { id_user: Number(id) },
    });

    res
      .status(200)
      .json({ status: "success", message: "Akun berhasil dihapus!" });
  } catch (error) {
    res.status(404).json({ status: "error", message: "User tidak ditemukan." });
  }
};
export const editUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, role, id_unit } = req.body;

    // 1. Cek apakah user ada
    const existingUser = await prisma.users.findUnique({
      where: { id_user: Number(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User tidak ditemukan", // ✅ Typo Unit -> User diperbaiki
      });
    }

    // 2. Siapkan data yang akan diupdate
    const updateData: any = {
      email,
      role,
      id_unit
    };

    // 3. ✅ LOGIKA PENGAMANAN PASSWORD
    // Hanya hash dan update password JIKA dikirimkan dari frontend (tidak kosong)
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // 4. Update user di database
    const updatedUser = await prisma.users.update({
      where: { id_user: Number(id) },
      data: updateData,
      // JANGAN KEMBALIKAN PASSWORD di respon!
      select: {
        id_user: true,
        email: true,
        role: true,
        id_unit: true,
        is_active: true
      }
    });

    res.status(200).json({
      message: "Akun user berhasil diupdate", 
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengupdate user", 
    });
  }
};