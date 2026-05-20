import type { Request, Response } from 'express';
import type { CustomRequest } from '../middlewares/authMiddleware.js';
import * as authService from '../services/auth.service.js';

// Fungsi bantuan untuk memetakan error dari Service ke HTTP Status Code
const handleError = (res: Response, error: any) => {
  const msg = error.message || '';
  if (msg.startsWith('BAD_REQUEST:')) return res.status(400).json({ status: 'error', message: msg.split(':')[1] });
  if (msg.startsWith('UNAUTHORIZED:')) return res.status(401).json({ status: 'error', message: msg.split(':')[1] });
  if (msg.startsWith('FORBIDDEN:')) return res.status(403).json({ status: 'error', message: msg.split(':')[1] });
  if (msg.startsWith('NOT_FOUND:')) return res.status(404).json({ status: 'error', message: msg.split(':')[1] });
  
  console.error('[AUTH_ERROR]', error);
  return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal server.' });
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);
    
    res.status(200).json({
      status: 'success',
      message: 'Login berhasil!',
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      data: result.user,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
export const logout = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    await authService.logoutUser(req.user?.id_user);
    
    res.status(200).json({
      status: 'success',
      message: 'Logout berhasil.',
    });
  } catch (error: any) {
    handleError(res, error);
  }
};

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const newAccessToken = await authService.refreshAccessToken(req.body.refresh_token);
    
    res.status(200).json({
      status: 'success',
      message: 'Access token berhasil diperbarui.',
      access_token: newAccessToken,
    });
  } catch (error: any) {
    handleError(res, error);
  }
};