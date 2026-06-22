import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { uploadExcel } from "../middlewares/upload.middleware";
import {
  uploadFile,
  validasiFormat,
  statusUpload,
  riwayatUpload,
  downloadTemplate,
  mahasiswaByBatches,
} from "../controllers/inbound.controller";

const router = Router();

/**
 * @route   GET /api/inbound/template
 * @desc    Download template Excel kosong untuk diisi data mahasiswa
 * @access  Private 
 */
router.get("/template", authenticate, downloadTemplate);

/**
 * @route   POST /api/inbound/validasi-format
 * @desc    Validasi format file Excel (cek kolom wajib) tanpa menyimpan ke DB
 * @access  Private (operator)
 * @body    form-data: file (Excel)
 */
router.post(
  "/validasi-format",
  authenticate,
  authorize("operator"),
  uploadExcel.single("file"),
  validasiFormat,
);

/**
 * @route   POST /api/inbound/upload
 * @desc    Upload file Excel + parsing + simpan data mahasiswa ke DB
 * @access  Private (operator)
 * @body    form-data: file (Excel), periode, tahun_lulus, id_template (opsional)
 */
router.post(
  "/upload",
  authenticate,
  authorize("operator"),
  uploadExcel.single("file"),
  uploadFile,
);

/**
 * @route   GET /api/inbound/riwayat
 * @desc    Riwayat semua batch upload dengan pagination
 * @access  Private (operator)
 * @query   page, limit, tahun_lulus, periode
 */
router.get(
  "/riwayat",
  authenticate,
  authorize("operator"),
  riwayatUpload,
);

/**
 * @route   GET /api/inbound/status/:id
 * @desc    Detail status satu batch upload (termasuk list mahasiswa & log error)
 * @access  Private ( operator)
 * @param   id - id_batch_upload
 */
router.get(
  "/status/:id",
  authenticate,
  authorize("operator"),
  statusUpload,
);
router.get(
  "/mahasiswa/by-batches",
  authenticate,
  authorize( "operator"),
  mahasiswaByBatches,
);
export default router;
