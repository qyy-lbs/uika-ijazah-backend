import type { Request, Response } from "express";
import { testDocumentDependencies } from "../services/document-test.service.js";
import { generateDocumentsByMahasiswaCode } from "../services/document-generate.service.js";
import {
  findDokumenById,
  findDokumenByMahasiswaCode,
} from "../repositories/dokumen.repository.js";
import { verifyDocumentByKodeQr } from "../services/document-verify.service.js";
import {
  getValidDocumentBatchDetail,
  getValidDocumentBatches,
} from "../services/dokumen-valid.service.js";

import {
  sendBatchDocumentEmailService,
  getStudentDownloadFileByToken,
  getStaffDownloadFileByKodeQr,
} from "../services/document-email.service.js";

type MahasiswaCodeParams = {
  mahasiswaCode: string;
};

type IdParams = {
  id: string;
};

type VerifyParams = {
  kodeQr: string;
};

type BatchCodeParams = {
  batchCode: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function healthDocument(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Document Service berjalan",
    service: "document-service",
  });
}

export async function testDependencies(
  req: Request<MahasiswaCodeParams>,
  res: Response,
) {
  try {
    const { mahasiswaCode } = req.params;

    const data = await testDocumentDependencies(mahasiswaCode);

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
  req: Request<MahasiswaCodeParams>,
  res: Response,
) {
  try {
    const { mahasiswaCode } = req.params;

    const data = await generateDocumentsByMahasiswaCode(mahasiswaCode);

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
  req: Request<MahasiswaCodeParams>,
  res: Response,
) {
  try {
    const { mahasiswaCode } = req.params;

    const data = await findDokumenByMahasiswaCode(mahasiswaCode);

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
        error instanceof Error
          ? error.message
          : "Gagal mengambil detail dokumen",
    });
  }
}

export async function verifyDocument(
  req: Request<VerifyParams>,
  res: Response,
) {
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
      fakultas:
        typeof req.query.fakultas === "string" ? req.query.fakultas : "",
      tahun: typeof req.query.tahun === "string" ? req.query.tahun : "",
      status_email:
        typeof req.query.status_email === "string"
          ? req.query.status_email
          : "",
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    });

    return res.json({
      success: true,
      message: "Daftar batch dokumen valid berhasil diambil",
      data: data.data,
      pagination: data.pagination,
      filter_options: data.filter_options,
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
  req: Request<BatchCodeParams>,
  res: Response,
) {
  try {
    const { batchCode } = req.params;

    if (!batchCode || !isUuid(batchCode)) {
      return res.status(400).json({
        success: false,
        message: "Kode batch tidak valid",
      });
    }

    const data = await getValidDocumentBatchDetail(batchCode, {
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

export async function sendBatchDocumentEmail(
  req: Request<{ batchCode: string }>,
  res: Response,
) {
  try {
    const user = (req as any).user;

    const data = await sendBatchDocumentEmailService({
      batchCode: req.params.batchCode,
      idUser: user?.id_user ?? null,
      role: user?.role,
    });

    return res.json({
      success: true,
      message: "Email dokumen batch berhasil diproses",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengirim email batch",
    });
  }
}

export async function downloadStudentDocument(
  req: Request<{ token: string }>,
  res: Response,
) {
  try {
    const data = await getStudentDownloadFileByToken(req.params.token);

    return res.download(data.absolutePath, data.fileName);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal download dokumen",
    });
  }
}

export async function downloadStaffDocument(
  req: Request<{ kodeQr: string }>,
  res: Response,
) {
  try {
    const user = (req as any).user;

    const data = await getStaffDownloadFileByKodeQr({
      kodeQr: req.params.kodeQr,
      role: user?.role,
    });

    return res.download(data.absolutePath, data.fileName);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal download dokumen",
    });
  }
}
