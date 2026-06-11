import { Router } from "express";
import { getProfile, getTranskrip, getValidasiAkademik, } from "../controllers/akademik.controller.js";
const router = Router();
router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Akademik Service health check OK",
        service: "akademik-service",
    });
});
router.get("/profile/:mahasiswaCode", getProfile);
router.get("/transkrip/:mahasiswaCode", getTranskrip);
router.get("/validasi/:mahasiswaCode", getValidasiAkademik);
export default router;
//# sourceMappingURL=akademik.routes.js.map