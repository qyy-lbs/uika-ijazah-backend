import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(res: Response, message: string, data?: T, statusCode = 200) {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, errors?: unknown, statusCode = 400) {
  const body: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(body);
}
