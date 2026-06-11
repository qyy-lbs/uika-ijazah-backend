import type { Request, Response } from "express";
import prisma from "../prisma/prisma.js";

import { testDocumentDependencies } from "../services/document-test.service.js";
import { generateDocumentsByNim } from "../services/document-generate.service.js";
import {
  findDokumenById,
  findDokumenByNim,
} from "../repositories/dokumen.repository.js";
import { verifyDocumentByKodeQr } from "../services/document-verify.service.js";
import {
  getValidDocumentBatchDetail,
  getValidDocumentBatches,
} from "../services/dokumen-valid.service.js";
import { decodeId, encodeId } from "../helpers/hashid.helper.js";

type MahasiswaParams = {
  mahasiswaCode: string;
};

type DokumenParams = {
  dokumenCode: string;
};

type BatchParams = {
  batchCode: string;
};

type VerifyParams = {
  kodeQr: string;
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

const getBatchIdFromCode = (batchCode?: string) => {
  if (!batchCode) {
    throw new Error("Kode batch wajib diisi");
  }

  const batchId = decodeId("batch", batchCode);

  if (!batchId || Number.isNaN(Number(batchId))) {
    throw new Error("Kode batch tidak valid");
  }

  return Number(batchId);
};

const getDokumenIdFromCode = (dokumenCode?: string) => {
  if (!dokumenCode) {
    throw new Error("Kode dokumen wajib diisi");
  }

  const dokumenId = decodeId("dokumen", dokumenCode);

  if (!dokumenId || Number.isNaN(Number(dokumenId))) {
    throw new Error("Kode dokumen tidak valid");
  }

  return Number(dokumenId);
};

const getNimFromMahasiswaCode = async (mahasiswaCode?: string) => {
  const mahasiswaId = getMahasiswaIdFromCode(mahasiswaCode);

  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: {
      id_mahasiswa: mahasiswaId,
    },
    select: {
      nim: true,
    },
  });

  if (!mahasiswa?.nim) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  return mahasiswa.nim;
};

const mapDokumenResponse = (dokumen: any) => {
  return {
    dokumen_code: encodeId("dokumen", Number(dokumen.id_dokumen)),

    mahasiswa_code: dokumen.id_mahasiswa
      ? encodeId("mahasiswa", Number(dokumen.id_mahasiswa))
      : null,

    ...dokumen,

    mahasiswa: dokumen.mahasiswa
      ? {
          mahasiswa_code: encodeId(
            "mahasiswa",
            Number(dokumen.mahasiswa.id_mahasiswa)
          ),

          ...dokumen.mahasiswa,
        }
      : dokumen.mahasiswa,
  };
};

export async function healthDocument(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Document Service berjalan",
    service: "document-service",
  });
}

export async function testDependencies(
  req: Request<MahasiswaParams>,
  res: Response
) {
  try {
    const nim = await getNimFromMahasiswaCode(req.params.mahasiswaCode);

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
  req: Request<MahasiswaParams>,
  res: Response
) {
  try {
    const mahasiswaCode = req.params.mahasiswaCode;
    const mahasiswaId = getMahasiswaIdFromCode(mahasiswaCode); 
    const nim = await getNimFromMahasiswaCode(mahasiswaCode)
    const data = await generateDocumentsByNim(nim, mahasiswaCode, mahasiswaId);
   
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
  req: Request<MahasiswaParams>,
  res: Response
) {
  try {
    const nim = await getNimFromMahasiswaCode(req.params.mahasiswaCode);

    const data = await findDokumenByNim(nim);

    return res.json({
      success: true,
      message: "Dokumen mahasiswa berhasil diambil",
      data: data.map(mapDokumenResponse),

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

export async function getDocumentDetail(
  req: Request<DokumenParams>,
  res: Response
) {
  try {
    const dokumenId = getDokumenIdFromCode(req.params.dokumenCode);

    const data = await findDokumenById(dokumenId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan",
      });
    }

    return res.json({
      success: true,
      message: "Detail dokumen berhasil diambil",
      data: mapDokumenResponse(data),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengambil detail dokumen",
    });
  }
}

export async function verifyDocument(req: Request<VerifyParams>, res: Response) {
  try {
    const { kodeQr } = req.params;

    const data = await verifyDocumentByKodeQr(kodeQr);

    if (!data.is_valid) {
      return res.status(404).json({
        success: false,
        message: data.message,
        data,
      });
    }

    return res.json({
      success: true,
      message: "Dokumen valid",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal verifikasi dokumen",
    });
  }
}

export async function getValidBatches(req: Request, res: Response) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const data = await getValidDocumentBatches({
      search: typeof req.query.search === "string" ? req.query.search : "",
      fakultas: typeof req.query.fakultas === "string" ? req.query.fakultas : "",
      tahun: typeof req.query.tahun === "string" ? req.query.tahun : "",
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    });

    return res.json({
      success: true,
      message: "Daftar batch dokumen valid berhasil diambil",
      data: data.data,
      pagination: data.pagination,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil batch dokumen valid",
    });
  }
}

export async function getValidBatchDetail(
  req: Request<BatchParams>,
  res: Response
) {
  try {
    const batchId = getBatchIdFromCode(req.params.batchCode);

    const data = await getValidDocumentBatchDetail(batchId, {
      search: typeof req.query.search === "string" ? req.query.search : "",
    });

    return res.json({
      success: true,
      message: "Detail batch dokumen valid berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengambil detail batch dokumen valid",
    });
  }
}