import { Router } from "express";
import {
  getByDocument,
  getChain,
  healthBlockchain,
  mineDocument,
  verifyChain,
  verifyDocument,
} from "../controllers/blockchain.controller.js";
import { verifyInternalService } from "../middlewares/internal.middleware.js";

const router = Router();

router.get("/health", healthBlockchain);

// Dipanggil internal oleh document-service nanti
router.post("/internal/mine", verifyInternalService, mineDocument);

// Untuk cek data blockchain
router.get("/chain", getChain);
router.get("/chain/verify", verifyChain);
router.get("/document/:id_dokumen", getByDocument);
router.get("/verify/:id_dokumen", verifyDocument);

export default router;