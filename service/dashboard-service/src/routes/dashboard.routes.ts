import { Router } from "express";
import { getHealth, getLatestValidation, getSummary,} from "../controllers/dashboard.controller.js";
import { getStatistikValidasi} from "../controllers/statistik.controller.js";
import { verifyToken} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/health", getHealth);

router.get( "/validations/latest",verifyToken, getLatestValidation);
router.get("/summary",  verifyToken,getSummary);
router.get("/statistik-validasi",verifyToken, getStatistikValidasi);

export default router;