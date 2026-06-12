import { Response } from "express";
import path from "path";
import fs from "fs";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import {
  processUpload,
  getStatusUpload,
  getRiwayatUpload,
  generateTemplateExcel,
  validateExcelFormat,
  getMahasiswaByBatchIds,
} from "../services/inbound.service";

type ImportErrorResponse = {
  row: number;
  nim?: string | null;
  nama_mahasiswa?: string | null;
  field: string;
  message: string;
};

type RejectedUploadResult = {
  ditolak?: boolean;
  alasan?: string;
  fakultas_utama?: string | null;
  total_data_excel?: number;
  total_valid?: number;
  total_gagal?: number;
  total_batch?: number;
  errors?: ImportErrorResponse[];
  unknown_columns?: string[];
  batches?: unknown[];
  mahasiswa?: unknown;
};
// ─────────────────────────────────────────────
// POST /api/inbound/upload
// Upload file Excel + proses data mahasiswa
// ─────────────────────────────────────────────
export async function uploadFile(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.file) {
      sendError(
        res,
        "File Excel tidak ditemukan dalam request.",
        undefined,
        400,
      );
      return;
    }

    const { periode, tahun_lulus, id_template } = req.body;

    const page = parseInt(String(req.body.page ?? req.query.page ?? "1"), 10);
    const limit = parseInt(
      String(req.body.limit ?? req.query.limit ?? "10"),
      10,
    );

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 10 : limit;

    if (!periode || !["semester ganjil", "semester genap"].includes(periode)) {
      sendError(
        res,
        "Field 'periode' wajib diisi dengan nilai 'semester ganjil' atau 'semester genap'.",
        undefined,
        422,
      );
      return;
    }

    const tahunLulusNum = parseInt(tahun_lulus, 10);

    if (
      !tahun_lulus ||
      Number.isNaN(tahunLulusNum) ||
      tahunLulusNum < 2000 ||
      tahunLulusNum > 2100
    ) {
      sendError(
        res,
        "Field 'tahun_lulus' wajib diisi dengan tahun yang valid (2000-2100).",
        undefined,
        422,
      );
      return;
    }

    const filePath = req.file.path;
    const namaFile = req.file.originalname;
    const uploadedBy = req.user!.id_user;

    const formatCheck = validateExcelFormat(filePath);

    if (!formatCheck.valid) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      sendError(
        res,
        "Format file Excel tidak sesuai.",
        {
          kolom_tidak_ada: formatCheck.missingColumns,
          kolom_tidak_dikenal: formatCheck.unknownColumns,
        },
        422,
      );
      return;
    }

    const result = await processUpload({
      filePath,
      namaFile,
      uploadedBy,
      periode: periode as "semester ganjil" | "semester genap",
      tahunLulus: tahunLulusNum,
      idTemplate: id_template ? parseInt(id_template, 10) : undefined,
      page: safePage,
      limit: safeLimit,
    });

    if (result.ditolak) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const rejectedResult = result as RejectedUploadResult;

  const resultErrors: ImportErrorResponse[] = Array.isArray(
    rejectedResult.errors,
  )
    ? rejectedResult.errors
    : [];

  res.status(422).json({
    success: false,
    message:
      rejectedResult.alasan ||
      "File Excel ditolak karena format atau isi data tidak valid.",
    ditolak: true,

    fakultas_utama: rejectedResult.fakultas_utama ?? null,

    total_data_excel: rejectedResult.total_data_excel ?? 0,
    total_valid: rejectedResult.total_valid ?? 0,
    total_gagal: rejectedResult.total_gagal ?? resultErrors.length,
    total_batch: rejectedResult.total_batch ?? 0,

    errors: resultErrors,

    unknown_columns: rejectedResult.unknown_columns ?? [],

    batches: rejectedResult.batches ?? [],
    mahasiswa:
      rejectedResult.mahasiswa ?? {
        data: [],
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: 0,
          total_pages: 0,
        },
      },
  });

  return;
}

    const statusCode = (result.total_gagal ?? 0) > 0 ? 207 : 201;

    const message =
      result.total_batch === 1
        ? `${result.total_valid} mahasiswa diimport dalam 1 batch.`
        : `${result.total_valid} mahasiswa diimport dalam ${result.total_batch} batch.`;

    sendSuccess(res, message, result, statusCode);
  } catch (err) {
    console.error("[uploadFile]", err);
    sendError(res, "Gagal memproses file upload.", undefined, 500);
  }
}

// ─────────────────────────────────────────────
// POST /api/inbound/validasi-format
// Hanya validasi format file tanpa menyimpan ke DB
// ─────────────────────────────────────────────
export async function validasiFormat(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.file) {
      sendError(
        res,
        "File Excel tidak ditemukan dalam request.",
        undefined,
        400,
      );
      return;
    }

    const filePath = req.file.path;
    const result = validateExcelFormat(filePath);

    // Hapus file sementara setelah validasi
    fs.unlinkSync(filePath);

    if (!result.valid) {
      sendError(
        res,
        "Format file tidak valid.",
        {
          kolom_tidak_ada: result.missingColumns,
          total_baris: result.totalRows,
        },
        422,
      );
      return;
    }

    sendSuccess(res, "Format file valid.", {
      valid: true,
      total_baris: result.totalRows,
    });
  } catch (err) {
    console.error("[validasiFormat]", err);
    sendError(res, "Gagal memvalidasi format file.", undefined, 500);
  }
}

// ─────────────────────────────────────────────
// GET /api/inbound/status/:id
// Status detail satu batch upload
// ─────────────────────────────────────────────
export async function statusUpload(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const id = parseInt(String(req.params["id"]), 10);
    if (isNaN(id)) {
      sendError(res, "ID batch tidak valid.", undefined, 400);
      return;
    }

    const data = await getStatusUpload(id);
    if (!data) {
      sendError(res, "Batch upload tidak ditemukan.", undefined, 404);
      return;
    }

    sendSuccess(res, "Detail status batch upload.", data);
  } catch (err) {
    console.error("[statusUpload]", err);
    sendError(res, "Gagal mengambil status batch upload.", undefined, 500);
  }
}

// ─────────────────────────────────────────────
// GET /api/inbound/riwayat
// Riwayat semua batch upload (paginated)
// ─────────────────────────────────────────────
export async function riwayatUpload(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tahunLulus = req.query.tahun_lulus
      ? parseInt(req.query.tahun_lulus as string)
      : undefined;
    const periodeRaw = req.query.periode;
    const periode = Array.isArray(periodeRaw)
      ? (periodeRaw[0] as string)
      : (periodeRaw as string | undefined);

    // Operator biasa hanya bisa lihat miliknya sendiri, admin bisa lihat semua
    const role = req.user!.role;
    const uploadedBy = role === "admin" ? undefined : req.user!.id_user;

    const result = await getRiwayatUpload({
      page,
      limit,
      uploadedBy,
      tahunLulus,
      periode,
    });

    sendSuccess(res, "Riwayat upload berhasil diambil.", result);
  } catch (err) {
    console.error("[riwayatUpload]", err);
    sendError(res, "Gagal mengambil riwayat upload.", undefined, 500);
  }
}

// ─────────────────────────────────────────────
// GET /api/inbound/template
// Download template Excel kosong
// ─────────────────────────────────────────────
export function downloadTemplate(_req: AuthRequest, res: Response): void {
  try {
    const buffer = generateTemplateExcel();
    const filename = `template_import_mahasiswa.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("[downloadTemplate]", err);
    sendError(res, "Gagal generate template Excel.", undefined, 500);
  }
}
export async function mahasiswaByBatches(req: AuthRequest, res: Response): Promise<void> {
  try {
    const batchIdsRaw = req.query.batch_ids as string | undefined;

    if (!batchIdsRaw) {
      sendError(res, "Query 'batch_ids' wajib diisi.", undefined, 400);
      return;
    }

    const batchIds = batchIdsRaw
      .split(",")
      .map((id) => parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));

    if (batchIds.length === 0) {
      sendError(res, "Query 'batch_ids' tidak valid.", undefined, 400);
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const searchRaw = req.query.search;
    const search = Array.isArray(searchRaw)
      ? (searchRaw[0] as string)
      : (searchRaw as string | undefined);

    const fakultasRaw = req.query.fakultas;
    const fakultas = Array.isArray(fakultasRaw)
      ? (fakultasRaw[0] as string)
      : (fakultasRaw as string | undefined);

    const tahunLulusRaw = req.query.tahun_lulus;
    const tahunLulus =
      typeof tahunLulusRaw === "string" && tahunLulusRaw !== "Semua Tahun"
        ? parseInt(tahunLulusRaw, 10)
        : undefined;

    const result = await getMahasiswaByBatchIds({
      batchIds,
      page,
      limit,
      search,
      fakultas,
      tahunLulus: Number.isNaN(tahunLulus) ? undefined : tahunLulus,
    });

    sendSuccess(res, "Data mahasiswa upload berhasil diambil.", result);
  } catch (err) {
    console.error("[mahasiswaByBatches]", err);
    sendError(res, "Gagal mengambil data mahasiswa upload.", undefined, 500);
  }
}