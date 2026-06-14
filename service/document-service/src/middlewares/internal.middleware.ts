import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


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


export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Token tidak disediakan",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah kedaluwarsa",
    });
  }
}