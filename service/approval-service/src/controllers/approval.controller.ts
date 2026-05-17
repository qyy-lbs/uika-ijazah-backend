import type { Request, Response } from "express";
import { getPendingBatchesForUser } from "../services/pending-batch.service.js";
import { getBatchDetailForUser } from "../services/batch-detail.service.js";    
import { approveBatchForUser } from "../services/approve-batch.service.js";
import { rejectBatchForUser } from "../services/reject-batch.service.js";
import { revokeMahasiswaForUser } from "../services/revoke-mahasiswa.service.js";
import { getLaporanApprovalForUser } from "../services/laporan.service.js";

type NimParams = {
  nim: string;
};

type BatchParams = {
  batchId: string;
};
export async function getPendingBatches(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const data = await getPendingBatchesForUser(user);

    return res.json({
      success: true,
      message: "Data batch pending berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function getBatchDetail(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const batchId = Number(req.params.batchId);

    if (!batchId || Number.isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        message: "ID batch tidak valid",
      });
    }

    const data = await getBatchDetailForUser(batchId, user);

    return res.json({
      success: true,
      message: "Detail batch berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}

export async function approveBatch(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const batchId = Number(req.params.batchId);

    if (!batchId || Number.isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        message: "ID batch tidak valid",
      });
    }

    const data = await approveBatchForUser(batchId, user);

    return res.json({
      success: true,
      message: "Batch berhasil divalidasi",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function rejectBatch(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const batchId = Number(req.params.batchId);

    if (!batchId || Number.isNaN(batchId)) {
      return res.status(400).json({
        success: false,
        message: "ID batch tidak valid",
      });
    }

    const body = req.body as { catatan?: string } | undefined;
    const catatan = body?.catatan;

    if (!catatan || catatan.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Catatan wajib diisi saat reject batch",
      });
    }

    const data = await rejectBatchForUser(batchId, user, catatan);

    return res.json({
      success: true,
      message: "Batch berhasil direject",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function revokeMahasiswa(
  req: Request<NimParams>,
  res: Response
) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const nim = req.params.nim;

    if (!nim) {
      return res.status(400).json({
        success: false,
        message: "NIM wajib diisi",
      });
    }

    const body = req.body as { catatan?: string } | undefined;
    const catatan = body?.catatan;

    if (!catatan || catatan.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Catatan wajib diisi saat revoke mahasiswa",
      });
    }

    const data = await revokeMahasiswaForUser(nim, user, catatan);

    return res.json({
      success: true,
      message: "Mahasiswa berhasil direvoke",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function getLaporanApproval(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi",
      });
    }

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const page =
      typeof req.query.page === "string" ? Number(req.query.page) : 1;

    const limit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 10;

    const query: {
      search?: string;
      status?: string;
      page: number;
      limit: number;
    } = {
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 10 : limit,
    };

    if (search) {
      query.search = search;
    }

    if (status) {
      query.status = status;
    }

    const result = await getLaporanApprovalForUser(user, query);

    return res.json({
      success: true,
      message: "Data laporan approval berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}