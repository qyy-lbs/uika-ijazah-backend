import prisma from "../prisma/prisma.js";
import { testDocumentDependencies } from "../services/document-test.service.js";
import { generateDocumentsByNim } from "../services/document-generate.service.js";
import { findDokumenById, findDokumenByNim, } from "../repositories/dokumen.repository.js";
import { verifyDocumentByKodeQr } from "../services/document-verify.service.js";
import { getValidDocumentBatchDetail, getValidDocumentBatches, } from "../services/dokumen-valid.service.js";
const isUuid = (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};
const getMahasiswaFromCode = async (mahasiswaCode) => {
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
            uuid: true,
            nim: true,
        },
    });
    if (!mahasiswa?.nim) {
        throw new Error("Mahasiswa tidak ditemukan");
    }
    if (!mahasiswa.uuid) {
        throw new Error("UUID mahasiswa tidak ditemukan");
    }
    return {
        id_mahasiswa: mahasiswa.id_mahasiswa,
        uuid: mahasiswa.uuid,
        nim: mahasiswa.nim,
    };
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
const getDokumenIdFromCode = async (dokumenCode) => {
    if (!dokumenCode) {
        throw new Error("Kode dokumen wajib diisi");
    }
    if (!isUuid(dokumenCode)) {
        throw new Error("Kode dokumen tidak valid");
    }
    const dokumen = await prisma.dokumen.findFirst({
        where: {
            uuid: dokumenCode,
        },
        select: {
            id_dokumen: true,
        },
    });
    if (!dokumen) {
        throw new Error("Dokumen tidak ditemukan");
    }
    return dokumen.id_dokumen;
};
const getNimFromMahasiswaCode = async (mahasiswaCode) => {
    const mahasiswa = await getMahasiswaFromCode(mahasiswaCode);
    return mahasiswa.nim;
};
const mapDokumenResponse = (dokumen) => {
    return {
        ...dokumen,
        dokumen_code: dokumen.uuid ?? dokumen.dokumen_uuid ?? null,
        mahasiswa_code: dokumen.mahasiswa?.uuid ??
            dokumen.mahasiswa_uuid ??
            null,
        mahasiswa: dokumen.mahasiswa
            ? {
                ...dokumen.mahasiswa,
                mahasiswa_code: dokumen.mahasiswa.uuid ?? null,
            }
            : dokumen.mahasiswa,
    };
};
export async function healthDocument(_req, res) {
    return res.json({
        success: true,
        message: "Document Service berjalan",
        service: "document-service",
    });
}
export async function testDependencies(req, res) {
    try {
        const nim = await getNimFromMahasiswaCode(req.params.mahasiswaCode);
        const data = await testDocumentDependencies(nim);
        return res.json({
            success: true,
            message: "Dependency document-service berhasil dipanggil",
            data,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Gagal memanggil dependency document-service",
        });
    }
}
export async function generateDocuments(req, res) {
    try {
        const mahasiswaCode = req.params.mahasiswaCode;
        const mahasiswa = await getMahasiswaFromCode(mahasiswaCode);
        const data = await generateDocumentsByNim(mahasiswa.nim, mahasiswa.uuid, mahasiswa.id_mahasiswa);
        return res.json({
            success: true,
            message: "Dokumen berhasil digenerate",
            data,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Gagal generate dokumen",
        });
    }
}
export async function getDocumentsByMahasiswa(req, res) {
    try {
        const nim = await getNimFromMahasiswaCode(req.params.mahasiswaCode);
        const data = await findDokumenByNim(nim);
        return res.json({
            success: true,
            message: "Dokumen mahasiswa berhasil diambil",
            data: data.map(mapDokumenResponse),
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Gagal mengambil dokumen mahasiswa",
        });
    }
}
export async function getDocumentDetail(req, res) {
    try {
        const dokumenId = await getDokumenIdFromCode(req.params.dokumenCode);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Gagal mengambil detail dokumen",
        });
    }
}
export async function verifyDocument(req, res) {
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
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Gagal verifikasi dokumen",
        });
    }
}
export async function getValidBatches(req, res) {
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Gagal mengambil batch dokumen valid",
        });
    }
}
export async function getValidBatchDetail(req, res) {
    try {
        const batchId = await getBatchIdFromCode(req.params.batchCode);
        const data = await getValidDocumentBatchDetail(batchId, {
            search: typeof req.query.search === "string" ? req.query.search : "",
        });
        return res.json({
            success: true,
            message: "Detail batch dokumen valid berhasil diambil",
            data,
        });
    }
    catch (error) {
        return res.status(404).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Gagal mengambil detail batch dokumen valid",
        });
    }
}
//# sourceMappingURL=document.controller.js.map