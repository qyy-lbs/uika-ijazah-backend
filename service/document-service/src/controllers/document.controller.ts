import type { Request, Response } from "express";
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
type VerifyParams = {
  kodeQr: string;
};

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

export async function getValidBatchDetail(req: Request, res: Response) {
  try {
    const batchId = Number(req.params.batchId);

    if (!Number.isFinite(batchId)) {
      return res.status(400).json({
        success: false,
        message: "ID batch tidak valid",
      });
    }

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