import { Router } from "express";

import {
  getDashboardSummary,
  getLatestValidations,
} from "../controllers/dashboard.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";


import {
  getStatistikTahunan,
  getStatistikValidasi,
} from "../controllers/statistik.controller.js";

import {
  getFaculties,
  getYears,
} from "../controllers/filter.controller.js";

import {
  getRejectRevokeNotifications,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/summary", getDashboardSummary);

router.get("/validations/latest", getLatestValidations);
router.get(
  "/notifications/latest",
  verifyToken,
  getRejectRevokeNotifications,
);

router.get("/statistik/tahunan", getStatistikTahunan);

router.get("/statistik/validasi", getStatistikValidasi);

router.get("/faculties", getFaculties);

router.get("/years", getYears);

export default router;