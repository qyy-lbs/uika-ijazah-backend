import type { Request, Response } from "express";
import * as userService from "../services/user.service.js";

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