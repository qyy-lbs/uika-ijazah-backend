import type { NextFunction, Request, Response } from "express";
import { getApprovalLevelByRole } from "../constants/approval-level.constant.js";

export function verifyApprovalRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user;

  if (!user || !user.role) {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Identitas tidak lengkap.",
    });
  }

  const approvalLevel = getApprovalLevelByRole(user.role);

  if (!approvalLevel) {
    return res.status(403).json({
      status: "error",
      message: `Akses ditolak. Jabatan '${user.role}' tidak memiliki wewenang approval.`,
    });
  }

  next();
}