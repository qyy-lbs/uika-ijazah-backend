import { Router } from "express";
import { healthDocument, testDependencies, generateDocuments, getDocumentsByMahasiswa, getDocumentDetail, verifyDocument, } from "../controllers/document.controller.js";
import { verifyInternalService } from "../middlewares/internal.middleware.js";
import { getValidBatches, getValidBatchDetail, } from "../controllers/document.controller.js";
const router = Router();
router.get("/health", healthDocument);
router.get("/valid-batches", getValidBatches);
router.get("/valid-batches/:batchCode/mahasiswa", getValidBatchDetail);
router.get("/test-dependencies/:mahasiswaCode", testDependencies);
router.post("/internal/generate/:mahasiswaCode", verifyInternalService, generateDocuments);
router.post("/generate/:mahasiswaCode", generateDocuments);
router.get("/mahasiswa/:mahasiswaCode", getDocumentsByMahasiswa);
router.get("/verify/:kodeQr", verifyDocument);
router.get("/:dokumenCode", getDocumentDetail);
export default router;
//# sourceMappingURL=document.routes.js.map