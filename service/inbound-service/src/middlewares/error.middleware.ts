import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import multer from 'multer';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ERROR]', err.message);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'Ukuran file melebihi batas maksimum yang diizinkan.', undefined, 413);
      return;
    }
    sendError(res, `Upload error: ${err.message}`, undefined, 400);
    return;
  }

  // File filter error dari multer
  if (err.message.includes('Format file tidak didukung')) {
    sendError(res, err.message, undefined, 422);
    return;
  }

  sendError(res, 'Terjadi kesalahan internal server.', err.message, 500);
}
