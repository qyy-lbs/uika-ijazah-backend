import type { Request, Response } from "express";
import { getProfileByNim } from "../services/profile.service.js";
import { getTranskripByNim } from "../services/transkrip.service.js";
import { getValidasiAkademikByNim } from "../services/validasi-akademik.service.js";

type NimParams = {
  nim: string;
};

export async function getProfile(req: Request<NimParams>, res: Response) {
  try {
    const nim = req.params.nim;

    const data = await getProfileByNim(nim);

    return res.json({
      success: true,
      message: "Profile akademik mahasiswa berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}

export async function getTranskrip(req: Request<NimParams>, res: Response) {
  try {
    const nim = req.params.nim;

    const data = await getTranskripByNim(nim);

    return res.json({
      success: true,
      message: "Data transkrip berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}

export async function getValidasiAkademik(req: Request<NimParams>, res: Response) {
  try {
    const nim = req.params.nim;

    const data = await getValidasiAkademikByNim(nim);

    return res.json({
      success: true,
      message: data.is_valid
        ? "Data akademik valid"
        : "Data akademik belum lengkap",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}