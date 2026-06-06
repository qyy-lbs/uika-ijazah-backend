import type { Request, Response } from "express";
import { testDocumentDependencies } from "../services/document-test.service.js";
import { generateDocumentsByNim } from "../services/document-generate.service.js";
import {
  findDokumenById,
  findDokumenByNim,
} from "../repositories/dokumen.repository.js";

type NimParams = {
  nim: string;
};

type IdParams = {
  id: string;
};

export async function healthDocument(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Document Service berjalan",
    service: "document-service",
  });
}

export async function testDependencies(
  req: Request<NimParams>,
  res: Response
) {
  try {
    const { nim } = req.params;

    const data = await testDocumentDependencies(nim);

    return res.json({
      success: true,
      message: "Dependency document-service berhasil dipanggil",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memanggil dependency document-service",
    });
  }
}

export async function generateDocuments(
  req: Request<NimParams>,
  res: Response
) {
  try {
    const { nim } = req.params;

    const data = await generateDocumentsByNim(nim);

    return res.json({
      success: true,
      message: "Dokumen berhasil digenerate",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal generate dokumen",
    });
  }
}

export async function getDocumentsByMahasiswa(
  req: Request<NimParams>,
  res: Response
) {
  try {
    const { nim } = req.params;

    const data = await findDokumenByNim(nim);

    return res.json({
      success: true,
      message: "Dokumen mahasiswa berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil dokumen mahasiswa",
    });
  }
}

export async function getDocumentDetail(req: Request<IdParams>, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID dokumen tidak valid",
      });
    }

    const data = await findDokumenById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      message: "Detail dokumen berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengambil detail dokumen",
    });
  }
}