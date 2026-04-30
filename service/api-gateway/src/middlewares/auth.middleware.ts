import type{ Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyGatewayToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Ambil header Authorization
  const authHeader = req.headers['authorization'];

  // 2. Ekstrak token (membuang kata "Bearer")
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Akses ditolak oleh Gateway. Token tidak disediakan."
    });
  }

  // 3. Verifikasi Token
  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      console.log("❌ Gateway Blocked Request:", err.message);
      return res.status(401).json({
        status: "error",
        message: "Gateway menolak akses: Sesi tidak valid atau telah kedaluwarsa."
      });
    }

    // Lolos sensor satpam, silakan lanjut ke service tujuan
    next();
  });
};