import type { Request, Response } from "express";
import * as userService from "../services/user.service.js";
import * as userRepository from "../repositories/user.repository.js"; // Sesuaikan path-nya
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({
      status: "success",
      message: "Akun baru berhasil dibuat dan siap digunakan!",
      data: newUser,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ status: "success", data: users });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: "Gagal mengambil data." });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await userService.deleteUser(req.params.id as string);
    res.status(200).json({ status: "success", message: "Akun berhasil dihapus!" });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};

export const editUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedUser = await userService.editUser(req.params.id as string, req.body);
    res.status(200).json({
      message: "Akun user berhasil diupdate", 
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};

export const getCurrentUser = async (req: any, res: any) => {
  try {
    // 1. Ambil ID User dari token
    const userId = req.user?.id_user || req.user?.id; 

    if (!userId) {
      return res.status(401).json({ 
        status: false, 
        message: "Tidak ada akses (Unauthorized). Token tidak valid." 
      });
    }

    // 2. Cari data user di database
    const user = await userRepository.findUserById(userId);

    if (!user) {
      return res.status(404).json({ 
        status: false, 
        message: "User tidak ditemukan di database." 
      });
    }

    const unitData: any = (user as any).unit || (user as any).units;

   // 🔥 LOGIKA MAPPING DISESUAIKAN (Tanpa label Admin/Operator)
    let namaTampil = "-";
    let nidnTampil = "-";

    // 1. CEK ROLE PEJABAT (Hanya jika ada unitData)
    if (unitData) {
      if (user.role === "rektor") {
        namaTampil = unitData.rektor || "-";
        nidnTampil = unitData.nidnRektor || unitData.nidn_rektor || "-";
      } 
      else if (user.role === "wakil_rektor_1") {
        namaTampil = unitData.wakil_rektor_1 || unitData.wakilRektor || unitData.wakil || "-";
        nidnTampil = unitData.nidnWakilRektor || unitData.nidn_wakil_rektor_1 || "-";
      } 
      else if (user.role === "tu_rektorat") {
        namaTampil = unitData.tu_rektorat || unitData.katu || "-";
        nidnTampil = unitData.nidn_tu_rektorat || "-";
      } 
      else if (user.role === "dekan") {
        namaTampil = unitData.dekan || "-";
        nidnTampil = unitData.nidnDekan || unitData.nidn_dekan || "-";
      } 
      else if (user.role === "wakil_dekan_1") {
        namaTampil = unitData.wakil_dekan_1 || unitData.wakil || "-";
        nidnTampil = unitData.nidnWakil || unitData.nidn_wakil_dekan_1 || "-";
      } 
      else if (user.role === "tu_fakultas") {
        namaTampil = unitData.tu_fakultas || unitData.katu || "-";
        nidnTampil = "-";
      }
    } 
    // 2. JIKA ADMIN / OPERATOR ATAU ROLE TANPA UNIT
    else {
      namaTampil = "-"; 
      nidnTampil = "-";
    }
    

    // 4. Kirim respons ke Frontend
    return res.status(200).json({
      status: true,
      data: {
        id_user: user.id_user,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        nama: namaTampil, // 🔥 Hasil saringan nama yang sudah akurat
        nidn: nidnTampil  // 🔥 Hasil saringan NIDN yang sudah akurat
      },
    });

  } catch (error: any) {
    console.error("🚨 Error di getCurrentUser:", error);
    return res.status(500).json({ 
      status: false, 
      message: error.message || "Terjadi kesalahan pada server (Internal Server Error)." 
    });
  }
};