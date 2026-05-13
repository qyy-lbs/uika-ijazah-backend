import { Router } from "express";

import {
  getProfile,
  getRektoratDashboard,
  getFakultasDashboard,
  getOperasionalDashboard,
} from "../controllers/profileController.js";

import { verifyToken, authorizeRoles } from "../middlewares/masterMiddleware.js";

const router = Router();

// Semua rute di sini wajib pakai token
router.use(verifyToken);

// Rute Umum: Siapapun yang punya JWT bisa lihat profilnya sendiri
router.get("/", getProfile); // Cukup "/" karena di index.js nanti sudah pakai /api/profile

// --- PINTU BERLAPIS BERDASARKAN JABATAN ---
router.get(
  "/dashboard-rektorat",
  authorizeRoles("rektor", "wakil_rektor", "tu_rektorat"),
  getRektoratDashboard
);

router.get(
  "/dashboard-fakultas",
  authorizeRoles("dekan", "wakil_dekan", "tu_fakultas"),
  getFakultasDashboard
);

router.get(
  "/dashboard-operasional",
  authorizeRoles("operator_data", "admin"),
  getOperasionalDashboard
);

export default router;