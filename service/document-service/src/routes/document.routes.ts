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
  sendBatchDocumentEmail,
  downloadStudentDocument,
  downloadStaffDocument,
} from "../controllers/document.controller.js";
import { verifyInternalService, verifyToken } from "../middlewares/internal.middleware.js";


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
router.post(
  "/send-email/batch/:batchCode",
  verifyToken,
  sendBatchDocumentEmail,
);

router.get(
  "/public/download/:token",
  downloadStudentDocument,
);

router.get(
  "/download/:kodeQr",
  verifyToken,
  downloadStaffDocument,
);

router.get("/:id", getDocumentDetail);


export default router;
