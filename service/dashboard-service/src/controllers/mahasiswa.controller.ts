import type { Request, Response } from "express";
import { getDetailMahasiswaService } from "../services/mahasiswa.service.js";

export const getDetailMahasiswa = async (
  req: Request,
  res: Response
) => {

  try {

    const id = Number(req.params.id);

    const data =
      await getDetailMahasiswaService(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Mahasiswa tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};