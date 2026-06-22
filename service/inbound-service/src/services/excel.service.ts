import * as XLSX from "xlsx";
import type { MahasiswaRow, RowError } from "../types";
import { parseDate } from "../utils/helpers";

const REQUIRED_COLUMNS: (keyof MahasiswaRow)[] = [
  "nim",
  "nama_mahasiswa",
  "nama_prodi",
  "tahun_lulus",
];
const COLUMN_MAP: Record<string, keyof MahasiswaRow> = {
  nim: "nim",
  nik: "nik",
  nomor_seri_ijazah: "nomor_seri_ijazah",
  pisn: "pisn",
  nama_mahasiswa: "nama_mahasiswa",
  tempat_lahir: "tempat_lahir",
  tanggal_lahir: "tanggal_lahir",
  program: "program",
  program_en: "program_en",
  gelar: "gelar",
  gelar_en: "gelar_en",
  jenis_kelamin: "jenis_kelamin",
  telepon: "telepon",
  email: "email",
  foto: "foto",
  judul_skripsi: "judul_skripsi",
  tahun_masuk: "tahun_masuk",
  tahun_lulus: "tahun_lulus",
  status_kelulusan: "status_kelulusan",
  tanggal_kelulusan: "tanggal_kelulusan",
  nama_prodi: "nama_prodi",
};

export interface ExcelParseResult {
  valid: MahasiswaRow[];
  errors: RowError[];
  unknown_columns: string[];
}

function getNim(row: Partial<MahasiswaRow>): string | null {
  return row.nim ? String(row.nim).trim() : null;
}

function getNamaMahasiswa(row: Partial<MahasiswaRow>): string | null {
  return row.nama_mahasiswa ? String(row.nama_mahasiswa).trim() : null;
}

function buildRowError(data: {
  row: number;
  sourceRow: Partial<MahasiswaRow>;
  field: string;
  message: string;
}): RowError {
  return {
    row: data.row,
    nim: getNim(data.sourceRow),
    nama_mahasiswa: getNamaMahasiswa(data.sourceRow),
    field: data.field,
    message: data.message,
  };
}

export function parseExcelFile(filePath: string): ExcelParseResult {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];

  const valid: MahasiswaRow[] = [];
  const errors: RowError[] = [];
  const unknown_columns: string[] = [];

  if (!sheetName) {
    return { valid, errors, unknown_columns };
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return { valid, errors, unknown_columns };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });

  if (rawRows.length === 0) {
    return { valid, errors, unknown_columns };
  }

  const firstRow = rawRows[0];

  if (!firstRow) {
    return { valid, errors, unknown_columns };
  }

  const firstRowKeys = Object.keys(firstRow);

  for (const rawKey of firstRowKeys) {
    const normalKey = rawKey.toLowerCase().trim().replace(/\s+/g, "_");

    if (!COLUMN_MAP[normalKey]) {
      unknown_columns.push(rawKey);
    }
  }

  if (unknown_columns.length > 0) {
    return { valid: [], errors: [], unknown_columns };
  }

  rawRows.forEach((rawRow, index) => {
    const rowNum = index + 2;
    const row: Partial<MahasiswaRow> = {};

    for (const [rawKey, value] of Object.entries(rawRow)) {
      const normalKey = rawKey.toLowerCase().trim().replace(/\s+/g, "_");
      const mappedField = COLUMN_MAP[normalKey];

      if (mappedField) {
        (row as Record<string, unknown>)[mappedField] = value;
      }
    }

    const rowErrors: RowError[] = [];

    for (const col of REQUIRED_COLUMNS) {
      const val = (row as Record<string, unknown>)[col];

      if (val === null || val === undefined || String(val).trim() === "") {
        rowErrors.push(
          buildRowError({
            row: rowNum,
            sourceRow: row,
            field: String(col),
            message: `Kolom '${String(col)}' wajib diisi.`,
          }),
        );
      }
    }

    if (row.nim && !/^[A-Za-z0-9]+$/.test(String(row.nim).trim())) {
      rowErrors.push(
        buildRowError({
          row: rowNum,
          sourceRow: row,
          field: "nim",
          message: "NIM hanya boleh berisi huruf dan angka.",
        }),
      );
    }

    if (
      row.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email).trim())
    ) {
      rowErrors.push(
        buildRowError({
          row: rowNum,
          sourceRow: row,
          field: "email",
          message: "Format email tidak valid.",
        }),
      );
    }

    if (
      row.tahun_lulus !== null &&
      row.tahun_lulus !== undefined &&
      String(row.tahun_lulus).trim() !== ""
    ) {
      const tahunLulusNum = Number(row.tahun_lulus);

      if (
        Number.isNaN(tahunLulusNum) ||
        !Number.isInteger(tahunLulusNum) ||
        tahunLulusNum < 2000 ||
        tahunLulusNum > 2100
      ) {
        rowErrors.push(
          buildRowError({
            row: rowNum,
            sourceRow: row,
            field: "tahun_lulus",
            message:
              "Tahun lulus harus berupa tahun yang valid antara 2000 sampai 2100.",
          }),
        );
      } else {
        row.tahun_lulus = tahunLulusNum;
      }
    }

    if (row.tanggal_lahir) {
      const parsed = parseDate(row.tanggal_lahir);

      if (!parsed) {
        rowErrors.push(
          buildRowError({
            row: rowNum,
            sourceRow: row,
            field: "tanggal_lahir",
            message:
              "Format tanggal_lahir tidak valid. Gunakan DD/MM/YYYY atau YYYY-MM-DD.",
          }),
        );
      } else {
        row.tanggal_lahir = parsed.toISOString().slice(0, 10);
      }
    }

    if (row.tanggal_kelulusan) {
      const parsed = parseDate(row.tanggal_kelulusan);

      if (!parsed) {
        rowErrors.push(
          buildRowError({
            row: rowNum,
            sourceRow: row,
            field: "tanggal_kelulusan",
            message:
              "Format tanggal_kelulusan tidak valid. Gunakan DD/MM/YYYY atau YYYY-MM-DD.",
          }),
        );
      } else {
        row.tanggal_kelulusan = parsed.toISOString().slice(0, 10);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      (row as MahasiswaRow & { _rowNumber?: number })._rowNumber = rowNum;
      valid.push(row as MahasiswaRow);
    }
  });

  return { valid, errors, unknown_columns };
}
