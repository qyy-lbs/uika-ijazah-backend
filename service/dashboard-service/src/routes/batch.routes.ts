import { Router } from "express";
import { getBatches, getDetailBatch } from "../controllers/batch.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/batch", verifyToken, getBatches);
router.get("/batch/:id", verifyToken, getDetailBatch);

export default router;
