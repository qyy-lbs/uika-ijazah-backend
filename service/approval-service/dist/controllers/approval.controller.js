import { getPendingBatchesForUser } from "../services/pending-batch.service.js";
import { getBatchDetailForUser } from "../services/batch-detail.service.js";
import { approveBatchForUser } from "../services/approve-batch.service.js";
import { rejectBatchForUser } from "../services/reject-batch.service.js";
import { revokeMahasiswaForUser } from "../services/revoke-mahasiswa.service.js";
import { getLaporanApprovalForUser } from "../services/laporan.service.js";
import prisma from "../prisma/prisma.js";
const isUuid = (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};
const getBatchIdFromCode = async (batchCode) => {
    if (!batchCode) {
        throw new Error("Kode batch wajib diisi");
    }
    if (!isUuid(batchCode)) {
        throw new Error("Kode batch tidak valid");
    }
    const batch = await prisma.batch_upload.findFirst({
        where: {
            uuid: batchCode,
        },
        select: {
            id_batch_upload: true,
        },
    });
    if (!batch) {
        throw new Error("Batch tidak ditemukan");
    }
    return batch.id_batch_upload;
};
const getMahasiswaIdFromCode = async (mahasiswaCode) => {
    if (!mahasiswaCode) {
        throw new Error("Kode mahasiswa wajib diisi");
    }
    if (!isUuid(mahasiswaCode)) {
        throw new Error("Kode mahasiswa tidak valid");
    }
    const mahasiswa = await prisma.mahasiswa.findFirst({
        where: {
            uuid: mahasiswaCode,
        },
        select: {
            id_mahasiswa: true,
        },
    });
    if (!mahasiswa) {
        throw new Error("Mahasiswa tidak ditemukan");
    }
    return mahasiswa.id_mahasiswa;
};
export async function getPendingBatches(req, res) {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
    }
}
export async function getBatchDetail(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User belum terautentikasi",
            });
        }
        const batchId = await getBatchIdFromCode(req.params.batchCode);
        const data = await getBatchDetailForUser(batchId, user);
        return res.json({
            success: true,
            message: "Detail batch berhasil diambil",
            data,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
    }
}
export async function approveBatch(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User belum terautentikasi",
            });
        }
        const batchId = await getBatchIdFromCode(req.params.batchCode);
        const data = await approveBatchForUser(batchId, user);
        return res.json({
            success: true,
            message: "Batch berhasil divalidasi",
            data,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
    }
}
export async function rejectBatch(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User belum terautentikasi",
            });
        }
        const batchId = await getBatchIdFromCode(req.params.batchCode);
        const body = req.body;
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
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
    }
}
export async function revokeMahasiswa(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User belum terautentikasi",
            });
        }
        const mahasiswaId = await getMahasiswaIdFromCode(req.params.mahasiswaCode);
        const body = req.body;
        const catatan = body?.catatan;
        if (!catatan || catatan.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Catatan wajib diisi saat revoke mahasiswa",
            });
        }
        const data = await revokeMahasiswaForUser(mahasiswaId, user, catatan);
        return res.json({
            success: true,
            message: "Mahasiswa berhasil direvoke",
            data,
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
    }
}
export async function getLaporanApproval(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User belum terautentikasi",
            });
        }
        const search = typeof req.query.search === "string" ? req.query.search : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const page = typeof req.query.page === "string" ? Number(req.query.page) : 1;
        const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
        const query = {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
    }
}
//# sourceMappingURL=approval.controller.js.map