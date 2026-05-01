import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';
import { AuthRequest, JwtPayload } from '../types';
import { sendError } from '../utils/response';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Token tidak ditemukan. Silakan login terlebih dahulu.', undefined, 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token sudah kadaluarsa. Silakan login ulang.', undefined, 401);
    } else {
      sendError(res, 'Token tidak valid.', undefined, 401);
    }
  }
}

/**
 * RBAC: cek role user
 * Contoh: authorize('admin', 'operator')
 */
export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized.', undefined, 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, `Akses ditolak. Role '${req.user.role}' tidak diizinkan.`, undefined, 403);
      return;
    }
    next();
  };
}
