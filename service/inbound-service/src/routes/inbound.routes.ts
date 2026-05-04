import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { uploadExcel } from "../middlewares/upload.middleware";
import {
  uploadFile,
  validasiFormat,
  statusUpload,
  riwayatUpload,
  downloadTemplate,
} from "../controllers/inbound.controller";

const router = Router();

/**
 * @route   GET /api/inbound/template
 * @desc    Download template Excel kosong untuk diisi data mahasiswa
 * @access  Private (semua role)
 */
router.get("/template", authenticate, downloadTemplate);

/**
 * @route   POST /api/inbound/validasi-format
 * @desc    Validasi format file Excel (cek kolom wajib) tanpa menyimpan ke DB
 * @access  Private (admin, operator)
 * @body    form-data: file (Excel)
 */
router.post(
  "/validasi-format",
  authenticate,
  authorize("admin", "operator"),
  uploadExcel.single("file"),
  validasiFormat,
);

/**
 * @route   POST /api/inbound/upload
 * @desc    Upload file Excel + parsing + simpan data mahasiswa ke DB
 * @access  Private (admin, operator)
 * @body    form-data: file (Excel), periode, tahun_lulus, id_template (opsional)
 */
router.post(
  "/upload",
  authenticate,
  authorize("admin", "operator"),
  uploadExcel.single("file"),
  uploadFile,
);

/**
 * @route   GET /api/inbound/riwayat
 * @desc    Riwayat semua batch upload dengan pagination
 * @access  Private (admin: semua, operator: miliknya saja)
 * @query   page, limit, tahun_lulus, periode
 */
router.get(
  "/riwayat",
  authenticate,
  authorize("admin", "operator", "sistem"),
  riwayatUpload,
);

/**
 * @route   GET /api/inbound/status/:id
 * @desc    Detail status satu batch upload (termasuk list mahasiswa & log error)
 * @access  Private (admin, operator)
 * @param   id - id_batch_upload
 */
router.get(
  "/status/:id",
  authenticate,
  authorize("admin", "operator"),
  statusUpload,
);

export default router;
