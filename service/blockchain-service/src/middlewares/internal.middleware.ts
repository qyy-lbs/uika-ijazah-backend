import type { NextFunction, Request, Response } from "express";

export function verifyInternalService(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceKey = req.header("x-internal-service-key");

  if (!serviceKey) {
    res.status(403).json({
      success: false,
      message: "Akses ditolak. Internal service key tidak disediakan.",
    });
    return;
  }

  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    res.status(401).json({
      success: false,
      message: "Internal service key tidak valid.",
    });
    return;
  }

  next();
}