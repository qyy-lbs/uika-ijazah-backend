import { Router } from "express";
import { getApprovalLevelByRole } from "../constants/approval-level.constant.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { verifyApprovalRole, verifyReportAccess } from "../middleware/approval-role.middleware.js";
import { getPendingBatches, getBatchDetail, approveBatch, rejectBatch, revokeMahasiswa, getLaporanApproval } from "../controllers/approval.controller.js";


const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Approval Service health check OK",
    service: "approval-service",
  });
});
router.get("/me", verifyToken, verifyApprovalRole, (req, res) => {
  const user = req.user!;

  res.json({
    success: true,
    message: "Token approval valid",
    data: {
      user,
      approval_level: getApprovalLevelByRole(user.role),
    },
  });
});
router.get(
  "/batches/pending", verifyToken, verifyApprovalRole, getPendingBatches,
);
router.get(
  "/batches/:batchCode", verifyToken, verifyApprovalRole, getBatchDetail,
);
router.post(
  "/batches/:batchCode/approve", verifyToken, verifyApprovalRole, approveBatch
);
router.post(
  "/batches/:batchCode/reject", verifyToken, verifyApprovalRole, rejectBatch
);
router.post(
  "/mahasiswa/:mahasiswaCode/revoke", verifyToken, verifyApprovalRole, revokeMahasiswa
);
router.get(
  "/laporan", verifyToken, verifyReportAccess, getLaporanApproval
);
export default router;
