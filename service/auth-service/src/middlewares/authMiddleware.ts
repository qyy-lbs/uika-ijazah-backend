import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. cetakan khusus agar TypeScript tahu bahwa Request sekarang membawa data User
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // 2. Tangkap token dari header "Authorization"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  // 3. Jika token sama sekali tidak ada
  if (!token) {
    res.status(401).json({ status: 'error', message: 'Akses ditolak. Token tidak ditemukan!' });
    return;
  }

  // 4. Verifikasi keaslian token
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET belum diatur');

    // Jika token asli dan belum expired, kita buka isinya
    const decoded = jwt.verify(token, jwtSecret);
    
    // 5. Simpan isi token (id_user, role, dll) ke dalam request untuk dipakai di fungsi selanjutnya
    req.user = decoded;
    
    // 6. Persilakan masuk!
    next();
  } catch (error) {
    res.status(403).json({ status: 'error', message: 'Token tidak valid atau sudah kadaluarsa!' });
  }
};


//fitur RBAC
export const authorizeRoles = (...allowedRoles: string[])=> {
    return (req: AuthRequest, res:Response, next: NextFunction): void => {
        //1. pastikan data user ada
        if (!req.user || !req.user.role){
            res.status(403).json({
                status : 'error',
                message : 'Akses Ditolak. Identitas jabatan tidak ditemukan!'
            });
            return;
        }

        //2. cocokkan jabatan userr dengan daftar jabatan yang diizinkan masuk ke rute ini
        if(!allowedRoles.includes(req.user.role)){
            res.status(403).json({
                status: 'error',
                message: `Akses ditolak. Area ini hanya untuk: ${allowedRoles.join(' atau ')}`
            });
        }

        //3. jika jabatannya cocok maka perislahkan masuk
        next();
    };
};