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
export function verifyReportAccess(
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

  const allowedRoles = [
    "operator",
    "tu_fakultas",
    "wakil_dekan_1",
    "dekan",
    "tu_rektorat",
    "wakil_rektor_1",
    "rektor",
  ];

  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({
      status: "error",
      message: `Akses ditolak. Jabatan '${user.role}' tidak memiliki wewenang melihat laporan.`,
    });
  }

  next();
}