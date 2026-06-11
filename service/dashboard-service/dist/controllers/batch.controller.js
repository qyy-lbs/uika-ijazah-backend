import { getBatchDashboardService, getBatchService, getDetailBatchService } from "../services/batch.service.js";
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
export const getBatches = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const tahun_lulus = req.query.tahun_lulus;
        const periode = req.query.periode;
        const search = req.query.search;
        const status = req.query.status;
        const data = await getBatchService(page, limit, tahun_lulus, periode, search, status);
        res.status(200).json({
            success: true,
            ...data,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const getDashboardBatch = async (req, res) => {
    try {
        const data = await getBatchDashboardService();
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const getDetailBatch = async (req, res) => {
    try {
        const batchCodeParam = req.params.batchCode || req.params.id;
        const batchCode = Array.isArray(batchCodeParam)
            ? batchCodeParam[0]
            : batchCodeParam;
        if (!batchCode || typeof batchCode !== "string") {
            return res.status(400).json({
                success: false,
                message: "Kode batch wajib diisi",
            });
        }
        const batchId = await getBatchIdFromCode(batchCode);
        const status = typeof req.query.status === "string"
            ? req.query.status
            : "";
        const data = await getDetailBatchService(Number(batchId), status);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Batch tidak ditemukan",
            });
        }
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
};
//# sourceMappingURL=batch.controller.js.map