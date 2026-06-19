import type { Request, Response } from "express";
import { getRejectRevokeNotificationsService } from "../services/notification.service.js";

export const getRejectRevokeNotifications = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user || {};
    const limit = Number(req.query.limit) || 5;

    const data = await getRejectRevokeNotificationsService(
      user,
      limit,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil notifikasi reject/revoke",
    });
  }
};