import type { Request, Response } from "express";
import { getProfileByMahasiswaCode } from "../services/profile.service.js";
import { getTranskripByMahasiswaId } from "../services/transkrip.service.js";
import { getValidasiAkademikByMahasiswaId } from "../services/validasi-akademik.service.js";
import { findMahasiswaByUuid } from "../repositories/mahasiswa.repository.js";

type MahasiswaParams = {
  mahasiswaCode: string;
};

const getMahasiswaIdFromUuid = async (mahasiswaCode?: string) => {
  if (!mahasiswaCode) {
    throw new Error("Kode mahasiswa wajib diisi");
  }

  const mahasiswa = await findMahasiswaByUuid(mahasiswaCode);

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  return mahasiswa.id_mahasiswa;
};

export async function getProfile(
  req: Request<MahasiswaParams>,
  res: Response,
) {
  try {
    const { mahasiswaCode } = req.params;

    if (!mahasiswaCode) {
      return res.status(400).json({
        success: false,
        message: "Kode mahasiswa wajib diisi",
      });
    }

    const data = await getProfileByMahasiswaCode(mahasiswaCode);

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

export async function getTranskrip(
  req: Request<MahasiswaParams>,
  res: Response,
) {
  try {
    const mahasiswaId = await getMahasiswaIdFromUuid(
      req.params.mahasiswaCode,
    );

    const data = await getTranskripByMahasiswaId(mahasiswaId);

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

export async function getValidasiAkademik(
  req: Request<MahasiswaParams>,
  res: Response,
) {
  try {
    const mahasiswaId = await getMahasiswaIdFromUuid(
      req.params.mahasiswaCode,
    );

    const data = await getValidasiAkademikByMahasiswaId(mahasiswaId);

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