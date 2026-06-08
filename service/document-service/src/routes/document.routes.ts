import { Router } from "express";
import {
  healthDocument,
  testDependencies,
  generateDocuments,
  getDocumentsByMahasiswa,
  getDocumentDetail,
  verifyDocument,
} from "../controllers/document.controller.js";
import { verifyInternalService } from "../middlewares/internal.middleware.js";
import {
  getValidBatches,
  getValidBatchDetail,
} from "../controllers/document.controller.js";

const router = Router();

router.get("/health", healthDocument);
router.get("/valid-batches", getValidBatches);
router.get("/valid-batches/:batchId/mahasiswa", getValidBatchDetail);
router.get("/test-dependencies/:nim", testDependencies);
router.post("/internal/generate/:nim", verifyInternalService, generateDocuments);

router.post("/generate/:nim", generateDocuments);

router.get("/mahasiswa/:nim", getDocumentsByMahasiswa);
router.get("/verify/:kodeQr", verifyDocument);

router.get("/:id", getDocumentDetail);

export default router;