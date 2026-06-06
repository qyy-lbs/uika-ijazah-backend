import { Router } from "express";
import {
  healthDocument,
  testDependencies,
  generateDocuments,
  getDocumentsByMahasiswa,
  getDocumentDetail,
} from "../controllers/document.controller.js";

const router = Router();

router.get("/health", healthDocument);

router.get("/test-dependencies/:nim", testDependencies);

router.post("/generate/:nim", generateDocuments);

router.get("/mahasiswa/:nim", getDocumentsByMahasiswa);

router.get("/:id", getDocumentDetail);

export default router;