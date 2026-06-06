import { Router } from "express";
import {
  generateQr,
  healthQr,
  testInternalQr,
} from "../controllers/qr.controller.js";
import { verifyInternalService } from "../middlewares/internal.middleware.js";

const router = Router();

router.get("/health", healthQr);

router.get("/internal-test", verifyInternalService, testInternalQr);

router.post("/generate", verifyInternalService, generateQr);

export default router;