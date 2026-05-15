import { Router } from "express";
import {
  getProfile,
  getTranskrip,
  getValidasiAkademik,
} from "../controllers/akademik.controller.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Akademik Service health check OK",
    service: "akademik-service",
  });
});

router.get("/profile/:nim", getProfile);
router.get("/transkrip/:nim", getTranskrip);
router.get("/validasi/:nim", getValidasiAkademik);

export default router;