import type { Request, Response } from "express";
import { getProfileByMahasiswaId } from "../services/profile.service.js";
import { getTranskripByMahasiswaId } from "../services/transkrip.service.js";
import { getValidasiAkademikByMahasiswaId } from "../services/validasi-akademik.service.js";
import { decodeId } from "../helpers/hashid.helper.js";

type MahasiswaParams = {
  mahasiswaCode: string;
};

const getMahasiswaIdFromCode = (mahasiswaCode?: string) => {
  if (!mahasiswaCode) {
    throw new Error("Kode mahasiswa wajib diisi");
  }

  const mahasiswaId = decodeId("mahasiswa", mahasiswaCode);

  if (!mahasiswaId || Number.isNaN(Number(mahasiswaId))) {
    throw new Error("Kode mahasiswa tidak valid");
  }

  return Number(mahasiswaId);
};

export async function getProfile(
  req: Request<MahasiswaParams>,
  res: Response
) {
  try {
    const mahasiswaId = getMahasiswaIdFromCode(req.params.mahasiswaCode);

    const data = await getProfileByMahasiswaId(mahasiswaId);

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
  res: Response
) {
  try {
    const mahasiswaId = getMahasiswaIdFromCode(req.params.mahasiswaCode);

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
  res: Response
) {
  try {
    const mahasiswaId = getMahasiswaIdFromCode(req.params.mahasiswaCode);

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