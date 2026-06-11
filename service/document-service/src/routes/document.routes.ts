import { Router } from "express";
import {
  healthDocument,
  testDependencies,
  generateDocuments,
  getDocumentsByMahasiswa,
  getDocumentDetail,
  verifyDocument,
  getValidBatches,
  getValidBatchDetail,
} from "../controllers/document.controller.js";
import { verifyInternalService } from "../middlewares/internal.middleware.js";

const router = Router();

router.get("/health", healthDocument);

router.get("/valid-batches", getValidBatches);
router.get("/valid-batches/:batchCode/mahasiswa", getValidBatchDetail);

router.get("/test-dependencies/:mahasiswaCode", testDependencies);
router.post(
  "/internal/generate/:mahasiswaCode",
  verifyInternalService,
  generateDocuments,
);
router.post("/generate/:mahasiswaCode", generateDocuments);

router.get("/mahasiswa/:mahasiswaCode", getDocumentsByMahasiswa);
router.get("/verify/:kodeQr", verifyDocument);

/**
 * Route lama, masih numeric id. Tidak dipakai untuk URL detail batch/mahasiswa.
 */
router.get("/:id", getDocumentDetail);

export default router;
