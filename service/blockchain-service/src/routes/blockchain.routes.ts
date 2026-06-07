import { Router } from "express";
import {
  healthBlockchain,
  recordBlockchain,
  testInternalBlockchain,
} from "../controllers/blockchain.controller.js";
import { verifyInternalService } from "../middlewares/internal.middleware.js";

const router = Router();

router.get("/health", healthBlockchain);

router.get("/internal-test", verifyInternalService, testInternalBlockchain);

router.post("/record", verifyInternalService, recordBlockchain);

export default router;