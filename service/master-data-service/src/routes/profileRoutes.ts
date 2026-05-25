import { Router } from "express";

import {
  getProfile,
  getRektoratDashboard,
  getFakultasDashboard,
  getOperasionalDashboard,
} from "../controllers/profileController.js";

import { verifyToken, authorizeRoles } from "../middlewares/masterMiddleware.js";
import { getCurrentUser } from "../controllers/userController.js";

const router = Router();

// Semua rute di sini wajib pakai token
router.use(verifyToken);

// Rute Umum Lama (Mungkin Komandan pakai untuk hal lain)
router.get("/", getProfile); 

// 🔥 RUTE BARU KHUSUS UNTUK AMBIL DATA PROFIL LENGKAP
router.get("/me", getCurrentUser); 

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

// 🔥 HAPUS getCurrentUser DARI SINI
router.get(
  "/dashboard-operasional",
  authorizeRoles("operator", "admin"),
  getOperasionalDashboard 
);

export default router;