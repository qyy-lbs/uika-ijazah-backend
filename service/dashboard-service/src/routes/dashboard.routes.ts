import { Router } from "express";
import { getHealth, getLatestValidation, getSummary,} from "../controllers/dashboard.controller.js";
import { getStatistikValidasi} from "../controllers/statistik.controller.js";
import { verifyToken} from "../middlewares/auth.middleware.js";
import { getStatistikTahunan } from "../controllers/statistik-tahunan.controller.js";

const router = Router();

router.get("/health", getHealth);

router.get( "/validations/latest",verifyToken, getLatestValidation);
router.get("/summary",  verifyToken,getSummary);
router.get("/statistik-validasi",verifyToken, getStatistikValidasi);
router.get("/statistik-tahunan",getStatistikTahunan);

export default router;