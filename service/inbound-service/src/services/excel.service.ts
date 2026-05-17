import * as XLSX from 'xlsx';
import { MahasiswaRow, ParseResult, RowError } from '../types';
import { parseDate } from '../utils/helpers';

const REQUIRED_COLUMNS: (keyof MahasiswaRow)[] = ['nim', 'nama_mahasiswa'];

const COLUMN_MAP: Record<string, keyof MahasiswaRow> = {
  nim: 'nim',
  nik: 'nik',
  nomor_seri_ijazah: 'nomor_seri_ijazah',
  pisn: 'pisn',
  nama_mahasiswa: 'nama_mahasiswa',
  tempat_lahir: 'tempat_lahir',
  tanggal_lahir: 'tanggal_lahir',
  program: 'program',
  program_en: 'program_en',
  gelar: 'gelar',
  gelar_en: 'gelar_en',
  jenis_kelamin: 'jenis_kelamin',
  telepon: 'telepon',
  email: 'email',
  foto : 'foto',
  ipk: 'ipk',
  predikat: 'predikat',
  judul_skripsi: 'judul_skripsi',
  tahun_masuk: 'tahun_masuk',
  tahun_lulus: 'tahun_lulus',
  status_kelulusan: 'status_kelulusan',
  tanggal_kelulusan: 'tanggal_kelulusan',
  nama_prodi: 'nama_prodi',
};

export interface ExcelParseResult {
  valid: MahasiswaRow[];
  errors: RowError[];
  unknown_columns: string[];  // ← kolom tidak dikenal
}

export function parseExcelFile(filePath: string): ExcelParseResult {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });

  const valid: MahasiswaRow[] = [];
  const errors: RowError[] = [];
  const unknown_columns: string[] = [];

  if (rawRows.length === 0) {
    return { valid, errors, unknown_columns };
  }

  // Cek kolom tidak dikenal dari header baris pertama
  const firstRowKeys = Object.keys(rawRows[0]);
  for (const rawKey of firstRowKeys) {
    const normalKey = rawKey.toLowerCase().trim().replace(/\s+/g, '_');
    if (!COLUMN_MAP[normalKey]) {
      unknown_columns.push(rawKey);
    }
  }

  // Jika ada kolom tidak dikenal, langsung return error — tidak proses baris
  if (unknown_columns.length > 0) {
    return { valid: [], errors: [], unknown_columns };
  }

  rawRows.forEach((rawRow, index) => {
    const rowNum = index + 2;
    const row: Partial<MahasiswaRow> = {};

    for (const [rawKey, value] of Object.entries(rawRow)) {
      const normalKey = rawKey.toLowerCase().trim().replace(/\s+/g, '_');
      const mappedField = COLUMN_MAP[normalKey];
      if (mappedField) {
        (row as Record<string, unknown>)[mappedField] = value;
      }
    }

    const rowErrors: RowError[] = [];

    // Validasi kolom wajib
    for (const col of REQUIRED_COLUMNS) {
      const val = (row as Record<string, unknown>)[col];
      if (val === null || val === undefined || String(val).trim() === '') {
        rowErrors.push({
          row: rowNum,
          nim: row.nim ? String(row.nim) : undefined,
          field: col,
          message: `Kolom '${col}' wajib diisi.`,
        });
      }
    }

    // Validasi format NIM
    if (row.nim && !/^[A-Za-z0-9]+$/.test(String(row.nim).trim())) {
      rowErrors.push({
        row: rowNum,
        nim: String(row.nim),
        field: 'nim',
        message: 'NIM hanya boleh berisi huruf dan angka.',
      });
    }

    // Validasi format email
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email).trim())) {
      rowErrors.push({
        row: rowNum,
        nim: row.nim ? String(row.nim) : undefined,
        field: 'email',
        message: 'Format email tidak valid.',
      });
    }

    // Validasi IPK
    if (row.ipk !== null && row.ipk !== undefined) {
      const ipkNum = Number(row.ipk);
      if (isNaN(ipkNum) || ipkNum < 0 || ipkNum > 4) {
        rowErrors.push({
          row: rowNum,
          nim: row.nim ? String(row.nim) : undefined,
          field: 'ipk',
          message: 'IPK harus berupa angka antara 0.00 sampai 4.00.',
        });
      }
    }

    // Validasi tanggal_lahir
    if (row.tanggal_lahir) {
      const parsed = parseDate(row.tanggal_lahir);
      if (!parsed) {
        rowErrors.push({
          row: rowNum,
          nim: row.nim ? String(row.nim) : undefined,
          field: 'tanggal_lahir',
          message: 'Format tanggal_lahir tidak valid. Gunakan DD/MM/YYYY atau YYYY-MM-DD.',
        });
      } else {
        row.tanggal_lahir = parsed.toISOString().slice(0, 10);
      }
    }

    // Validasi tanggal_kelulusan
    if (row.tanggal_kelulusan) {
      const parsed = parseDate(row.tanggal_kelulusan);
      if (!parsed) {
        rowErrors.push({
          row: rowNum,
          nim: row.nim ? String(row.nim) : undefined,
          field: 'tanggal_kelulusan',
          message: 'Format tanggal_kelulusan tidak valid. Gunakan DD/MM/YYYY atau YYYY-MM-DD.',
        });
      } else {
        row.tanggal_kelulusan = parsed.toISOString().slice(0, 10);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push(row as MahasiswaRow);
    }
  });

  return { valid, errors, unknown_columns };
}