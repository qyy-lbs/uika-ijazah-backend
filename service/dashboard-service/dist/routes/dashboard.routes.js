import { Router } from "express";
import { getDashboardSummary, getLatestValidations, } from "../controllers/dashboard.controller.js";
import { getStatistikTahunan, getStatistikValidasi, } from "../controllers/statistik.controller.js";
import { getFaculties, getYears, } from "../controllers/filter.controller.js";
const router = Router();
router.get("/summary", getDashboardSummary);
router.get("/validations/latest", getLatestValidations);
router.get("/statistik/tahunan", getStatistikTahunan);
router.get("/statistik/validasi", getStatistikValidasi);
router.get("/faculties", getFaculties);
router.get("/years", getYears);
export default router;
//# sourceMappingURL=dashboard.routes.js.map