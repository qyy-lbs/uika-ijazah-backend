import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id_user: number;
  email: string;
  role: string;
  id_unit: number | null;
}

export interface CustomRequest extends Request {
  user?: AuthUser;
}

export function verifyToken(
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    res.status(403).json({
      success: false,
      message: "Akses ditolak. Token tidak disediakan.",
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET belum diatur");
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthUser;

    req.user = decoded;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Sesi tidak valid atau telah kedaluwarsa.",
    });
  }
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(403).json({
        success: false,
        message: "Akses ditolak. Identitas user tidak lengkap.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Role '${req.user.role}' tidak memiliki akses ke menu template.`,
      });
      return;
    }

    next();
  };
}