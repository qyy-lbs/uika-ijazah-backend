import { Router } from "express";

// Controllers (HANYA UNTUK AUTH)
import { login, logout, refreshToken } from "../controllers/authController.js";

// Middlewares
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// 1. Public routes (Tanpa Autentikasi)
router.post("/login", login);
router.post("/refresh", refreshToken); 

// 2. PROTECTED ROUTES (Wajib Autentikasi JWT)
// verifikasi jwt
router.use(verifyToken);

router.post("/logout", logout); // Harus login dulu baru bisa logout

export default router;