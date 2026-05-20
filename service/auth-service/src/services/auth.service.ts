import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authRepository from '../repositories/auth.repository.js';

export async function loginUser(data: any) {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error('BAD_REQUEST:Email dan password wajib diisi!');
  }

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new Error('NOT_FOUND:Akun tidak ditemukan!');
  }

  if (!user.is_active) {
    throw new Error('FORBIDDEN:Akun Anda sedang dinonaktifkan. Hubungi Admin.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('UNAUTHORIZED:Email atau Password Salah!');
  }

  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  
  if (!jwtSecret || !refreshSecret) {
    throw new Error('INTERNAL_SERVER:JWT secret belum diatur di .env');
  }

  // Buat Token
  const accessToken = jwt.sign(
    { id_user: user.id_user, email: user.email, role: user.role, id_unit: user.id_unit },
    jwtSecret,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    { id_user: user.id_user },
    refreshSecret,
    { expiresIn: '1d' }
  );

  // Simpan refresh token ke database
  await authRepository.updateUserSession(user.id_user, refreshToken);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      id_unit: user.id_unit,
    }
  };
}

export async function logoutUser(id_user?: number) {
  if (!id_user) {
    throw new Error('UNAUTHORIZED:Unauthorized.');
  }
  // Set refresh_token menjadi null di database
  await authRepository.updateUserSession(id_user, null);
}

export async function refreshAccessToken(refreshTokenStr: string) {
  if (!refreshTokenStr) {
    throw new Error('BAD_REQUEST:Refresh token tidak disediakan.');
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!refreshSecret || !jwtSecret) {
    throw new Error('INTERNAL_SERVER:JWT secret belum diatur di .env');
  }

  let decoded: { id_user: number };
  try {
    decoded = jwt.verify(refreshTokenStr, refreshSecret) as { id_user: number };
  } catch {
    throw new Error('UNAUTHORIZED:Refresh token tidak valid atau sudah kedaluwarsa.');
  }

  const user = await authRepository.findUserByIdForAuth(decoded.id_user);

  if (!user) {
    throw new Error('UNAUTHORIZED:User tidak ditemukan.');
  }

  if (!user.is_active) {
    throw new Error('FORBIDDEN:Akun telah dinonaktifkan.');
  }

  if (user.refresh_token !== refreshTokenStr) {
    throw new Error('UNAUTHORIZED:Refresh token tidak cocok. Silakan login ulang.');
  }

  const newAccessToken = jwt.sign(
    { id_user: user.id_user, email: user.email, role: user.role, id_unit: user.id_unit },
    jwtSecret,
    { expiresIn: '8h' }
  );

  return newAccessToken;
}