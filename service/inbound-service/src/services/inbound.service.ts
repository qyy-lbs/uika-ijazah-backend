import prisma from '../config/prisma';
import { parseExcelFile } from './excel.service';
import { generateNomorBatch, parseDate } from '../utils/helpers';
import { MahasiswaRow } from '../types';
import * as XLSX from 'xlsx';

const BATCH_SIZE = 10;

// ─────────────────────────────────────────────
// 1. UPLOAD FILE EXCEL & PROSES DATA
// ─────────────────────────────────────────────
export async function processUpload(params: {
  filePath: string;
  namaFile: string;
  uploadedBy: number;
  periode: 'semester ganjil' | 'semester genap';
  tahunLulus: number;
  idTemplate?: number;
}) {
  const { filePath, namaFile, uploadedBy, periode, tahunLulus, idTemplate } = params;

  const { valid, errors, unknown_columns } = parseExcelFile(filePath);

  if (unknown_columns.length > 0) {
    return {
      ditolak: true,
      alasan: 'File Excel mengandung kolom yang tidak dikenal.',
      unknown_columns,
      batches: [],
    };
  }

  const periodeEnum =
    periode === 'semester ganjil'
      ? ('semester_ganjil' as const)
      : ('semester_genap' as const);

  // Validasi nama_prodi
  const { validatedRows, prodiErrors } = await validateProdi(valid);

  // Validasi NIM duplikat di database
  const { uniqueRows, nimErrors } = await validateNimDuplikat(validatedRows);

  // Gabung semua errors
  const allErrors = [...errors, ...prodiErrors, ...nimErrors];

  // Pecah ke chunks
  const chunks = chunkArray(uniqueRows, BATCH_SIZE);
  const batchResults = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const batch = await prisma.batch_upload.create({
      data: {
        nomor_batch_upload: generateNomorBatch(),
        nama_file: chunks.length > 1
          ? `${namaFile} (batch ${i + 1}/${chunks.length})`
          : namaFile,
        total_record: chunk.length,
        record_berhasil: chunk.length,
        record_gagal: 0,
        uploaded_by: uploadedBy,
        periode: periodeEnum,
        tahun_lulus: tahunLulus,
        log_error: null,
        ...(idTemplate ? { id_template: idTemplate } : {}),
      },
    });

    // Insert mahasiswa di chunk ini dengan id_batch dari batch yang baru dibuat
    await insertMahasiswaBatch(chunk, batch.id_batch_upload);

    batchResults.push({
      batch_ke: i + 1,
      id_batch_upload: batch.id_batch_upload,
      nomor_batch_upload: batch.nomor_batch_upload,
      record_berhasil: chunk.length,
    });
  }

  return {
    ditolak: false,
    total_data_excel: valid.length + errors.length,
    total_valid: uniqueRows.length,
    total_gagal: allErrors.length,
    total_batch: chunks.length,
    errors: allErrors,
    batches: batchResults,
  };
}

// ─────────────────────────────────────────────
// HELPER — Cek NIM duplikat di database
// Baris yang NIM-nya sudah ada → pindah ke errors
// ─────────────────────────────────────────────
async function validateNimDuplikat(rows: MahasiswaRow[]): Promise<{
  uniqueRows: MahasiswaRow[];
  nimErrors: { row: number; nim: string; field: string; message: string }[];
}> {
  const uniqueRows: MahasiswaRow[] = [];
  const nimErrors: { row: number; nim: string; field: string; message: string }[] = [];

  // Cek duplikat antar baris dalam file Excel itu sendiri
  const nimDalamFile = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nim = String(row.nim).trim();
    const rowNum = i + 2;

    // Duplikat di dalam file Excel
    if (nimDalamFile.has(nim)) {
      nimErrors.push({
        row: rowNum,
        nim,
        field: 'nim',
        message: `NIM '${nim}' muncul lebih dari satu kali dalam file Excel.`,
      });
      continue;
    }

    // Duplikat dengan data yang sudah ada di database
    const existing = await prisma.mahasiswa.findUnique({
      where: { nim },
      select: { nim: true },
    });

    if (existing) {
      nimErrors.push({
        row: rowNum,
        nim,
        field: 'nim',
        message: `NIM '${nim}' sudah terdaftar di database dan tidak dapat diimport ulang.`,
      });
      continue;
    }

    nimDalamFile.add(nim);
    uniqueRows.push(row);
  }

  return { uniqueRows, nimErrors };
}

// ─────────────────────────────────────────────
// HELPER — Validasi nama_prodi ke DB
// ─────────────────────────────────────────────
async function validateProdi(rows: MahasiswaRow[]): Promise<{
  validatedRows: MahasiswaRow[];
  prodiErrors: { row: number; nim?: string; field: string; message: string }[];
}> {
  const prodiCache: Record<string, number | null> = {};
  const validatedRows: MahasiswaRow[] = [];
  const prodiErrors: { row: number; nim?: string; field: string; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.nama_prodi) {
      validatedRows.push(row);
      continue;
    }

    const namaProdi = row.nama_prodi.trim();

    if (!(namaProdi in prodiCache)) {
      const prodi = await prisma.prodi.findFirst({
        where: { nama_prodi: { equals: namaProdi, mode: 'insensitive' } },
        select: { id_prodi: true },
      });
      prodiCache[namaProdi] = prodi ? prodi.id_prodi : null;
    }

    const idProdi = prodiCache[namaProdi];

    if (idProdi === null) {
      prodiErrors.push({
        row: rowNum,
        nim: String(row.nim),
        field: 'nama_prodi',
        message: `Prodi '${namaProdi}' tidak ditemukan di database. Periksa penulisan nama prodi.`,
      });
    } else {
      (row as MahasiswaRow & { _resolved_id_prodi?: number })._resolved_id_prodi = idProdi;
      validatedRows.push(row);
    }
  }

  return { validatedRows, prodiErrors };
}

// ─────────────────────────────────────────────
// HELPER — Pecah array menjadi chunks
// ─────────────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─────────────────────────────────────────────
// 2. INSERT MAHASISWA — hanya create, tidak update
// ─────────────────────────────────────────────
async function insertMahasiswaBatch(rows: MahasiswaRow[], idBatchUpload: number) {
  for (const row of rows) {
    try {
      const resolvedIdProdi =
        (row as MahasiswaRow & { _resolved_id_prodi?: number })._resolved_id_prodi ?? null;

      await prisma.mahasiswa.create({
        data: {
          nim: String(row.nim).trim(),
          id_batch_upload: idBatchUpload,
          nik: row.nik ? String(row.nik).trim() : null,
          nomor_seri_ijazah: row.nomor_seri_ijazah ? String(row.nomor_seri_ijazah).trim() : null,
          pisn: row.pisn ? String(row.pisn).trim() : null,
          nama_mahasiswa: String(row.nama_mahasiswa).trim(),
          tempat_lahir: row.tempat_lahir ? String(row.tempat_lahir).trim() : null,
          tanggal_lahir: row.tanggal_lahir ? parseDate(row.tanggal_lahir) : null,
          program: row.program ? String(row.program).trim() : null,
          program_en: row.program_en ? String(row.program_en).trim() : null,
          gelar: row.gelar ? String(row.gelar).trim() : null,
          gelar_en: row.gelar_en ? String(row.gelar_en).trim() : null,
          jenis_kelamin: row.jenis_kelamin ? String(row.jenis_kelamin).trim() : null,
          telepon: row.telepon ? String(row.telepon).trim() : null,
          email: row.email ? String(row.email).trim() : null,
          ipk: row.ipk != null ? Number(row.ipk) : null,
          predikat: row.predikat ? String(row.predikat).trim() : null,
          judul_skripsi: row.judul_skripsi ? String(row.judul_skripsi).trim() : null,
          tahun_masuk: row.tahun_masuk ? Number(row.tahun_masuk) : null,
          tahun_lulus: row.tahun_lulus ? Number(row.tahun_lulus) : null,
          status_kelulusan: row.status_kelulusan ? String(row.status_kelulusan).trim() : null,
          tanggal_kelulusan: row.tanggal_kelulusan ? parseDate(row.tanggal_kelulusan) : null,
          ...(resolvedIdProdi ? { id_prodi: resolvedIdProdi } : {}),
        },
      });
    } catch (err) {
      console.error(`[INBOUND] Gagal insert NIM ${row.nim}:`, err);
    }
  }
}

// ─────────────────────────────────────────────
// 3. STATUS UPLOAD
// ─────────────────────────────────────────────
export async function getStatusUpload(idBatchUpload: number) {
  const batch = await prisma.batch_upload.findUnique({
    where: { id_batch_upload: idBatchUpload },
    include: {
      users: { select: { id_user: true, email: true, role: true } },
      template: { select: { id_template: true, jenis_template: true } },
      mahasiswa: {
        select: {
          id_mahasiswa: true,
          nim: true,
          nama_mahasiswa: true,
          status_kelulusan: true,
        },
      },
    },
  });

  if (!batch) return null;

  return {
    ...batch,
    log_error: batch.log_error ? JSON.parse(batch.log_error) : [],
  };
}

// ─────────────────────────────────────────────
// 4. RIWAYAT UPLOAD
// ─────────────────────────────────────────────
export async function getRiwayatUpload(params: {
  page: number;
  limit: number;
  uploadedBy?: number;
  tahunLulus?: number;
  periode?: string;
}) {
  const { page, limit, uploadedBy, tahunLulus, periode } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (uploadedBy) where.uploaded_by = uploadedBy;
  if (tahunLulus) where.tahun_lulus = tahunLulus;
  if (periode) where.periode = periode;

  const [data, total] = await Promise.all([
    prisma.batch_upload.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id_user: true, email: true } },
        template: { select: { id_template: true, jenis_template: true } },
      },
    }),
    prisma.batch_upload.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

// ─────────────────────────────────────────────
// 5. GENERATE TEMPLATE EXCEL
// ─────────────────────────────────────────────
export function generateTemplateExcel(): Buffer {
  const headers = [
    'nim', 'nik', 'nomor_seri_ijazah', 'pisn', 'nama_mahasiswa',
    'tempat_lahir', 'tanggal_lahir', 'program', 'program_en',
    'gelar', 'gelar_en', 'jenis_kelamin', 'telepon', 'email',
    'ipk', 'predikat', 'judul_skripsi', 'tahun_masuk', 'tahun_lulus',
    'status_kelulusan', 'tanggal_kelulusan', 'nama_prodi',
  ];

  const exampleRow = [
    '2021001001', '3201010101010001', 'DN/2024/0001', '',
    'Budi Santoso', 'Jakarta', '2000-01-15', 'S1', 'Bachelor',
    'S.Kom.', 'S.Kom.', 'Laki-laki', '08123456789', 'budi@email.com',
    '3.75', 'Sangat Memuaskan', 'Analisis Sistem Informasi Berbasis AI',
    '2021', '2025', 'Lulus', '2025-02-10', 'Teknik Informatika',
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Data Mahasiswa');

  const petunjukData = [
    ['PETUNJUK PENGISIAN'],
    [''],
    ['1. Kolom nim dan nama_mahasiswa wajib diisi.'],
    ['2. Format tanggal: YYYY-MM-DD atau DD/MM/YYYY.'],
    ['3. IPK diisi dengan angka desimal, contoh: 3.75'],
    ['4. nama_prodi diisi sesuai nama prodi yang terdaftar di sistem.'],
    ['5. Jenis kelamin: Laki-laki / Perempuan'],
    ['6. Jangan tambah atau ubah nama kolom di baris pertama.'],
    ['7. Kolom yang tidak ada di template akan menyebabkan upload ditolak.'],
    ['8. NIM yang sudah terdaftar di database tidak akan diimport ulang.'],
  ];
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
  wsPetunjuk['!cols'] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ─────────────────────────────────────────────
// 6. VALIDASI FORMAT FILE
// ─────────────────────────────────────────────
export function validateExcelFormat(filePath: string): {
  valid: boolean;
  missingColumns: string[];
  unknownColumns: string[];
  totalRows: number;
} {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  if (rows.length === 0) {
    return { valid: false, missingColumns: [], unknownColumns: [], totalRows: 0 };
  }

  const ALLOWED_COLUMNS = [
    'nim', 'nik', 'nomor_seri_ijazah', 'pisn', 'nama_mahasiswa',
    'tempat_lahir', 'tanggal_lahir', 'program', 'program_en',
    'gelar', 'gelar_en', 'jenis_kelamin', 'telepon', 'email',
    'ipk', 'predikat', 'judul_skripsi', 'tahun_masuk', 'tahun_lulus',
    'status_kelulusan', 'tanggal_kelulusan', 'nama_prodi',
  ];

  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const missingColumns = ['nim', 'nama_mahasiswa'].filter((col) => !headers.includes(col));
  const unknownColumns = headers.filter((h) => !ALLOWED_COLUMNS.includes(h));

  return {
    valid: missingColumns.length === 0 && unknownColumns.length === 0,
    missingColumns,
    unknownColumns,
    totalRows: rows.length,
  };
}