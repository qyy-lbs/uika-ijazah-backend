import { Request } from 'express';

export interface JwtPayload {
  id_user: number;
  email: string;
  role: string;
  id_unit?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Kolom wajib di file Excel mahasiswa
export interface MahasiswaRow {
  nim: string;
  nik?: string;
  nomor_seri_ijazah?: string;
  pisn?: string;
  nama_mahasiswa: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;   // format: YYYY-MM-DD atau DD/MM/YYYY
  program?: string;
  program_en?: string;
  gelar?: string;
  gelar_en?: string;
  jenis_kelamin?: string;
  telepon?: string;
  email?: string;
  ipk?: number;
  predikat?: string;
  judul_skripsi?: string;
  tahun_masuk?: number;
  tahun_lulus?: number;
  status_kelulusan?: string;
  tanggal_kelulusan?: string; // format: YYYY-MM-DD atau DD/MM/YYYY
  nama_prodi?: string;
}

export interface ParseResult {
  valid: MahasiswaRow[];
  errors: RowError[];
}

export interface RowError {
  row: number;
  nim?: string;
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}
