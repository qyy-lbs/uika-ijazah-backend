import prisma from "../config/prisma";
import { parseExcelFile } from "./excel.service";
import {
  generateNomorBatch,
  getSingkatanFakultas,
  parseDate,
} from "../utils/helpers";
import type { MahasiswaRow } from "../types";
import * as XLSX from "xlsx";

const BATCH_SIZE = 10;

type ImportError = {
  row: number;
  nim?: string | null;
  nama_mahasiswa?: string | null;
  field: string;
  message: string;
};

type ResolvedMahasiswaRow = MahasiswaRow & {
  _resolved_id_prodi?: number;
  _resolved_nama_fakultas?: string | null;
};

function buildImportError(data: {
  row: number;
  nim?: string | null;
  nama_mahasiswa?: string | null;
  field: string;
  message: string;
}): ImportError {
  return {
    row: data.row,
    nim: data.nim ?? null,
    nama_mahasiswa: data.nama_mahasiswa ?? null,
    field: data.field,
    message: data.message,
  };
}

function normalizePageLimit(page?: number, limit?: number) {
  return {
    page: !page || Number.isNaN(page) || page < 1 ? 1 : page,
    limit: !limit || Number.isNaN(limit) || limit < 1 ? 10 : limit,
  };
}

function mapMahasiswaResponse(mhs: any) {
  return {
    id: mhs.id_mahasiswa,
    id_mahasiswa: mhs.id_mahasiswa,
    mahasiswa_code: mhs.uuid ?? null,
    uuid: mhs.uuid ?? null,
    nim: mhs.nim,
    nik: mhs.nik,
    nomor_seri_ijazah: mhs.nomor_seri_ijazah,
    pisn: mhs.pisn,

    nama: mhs.nama_mahasiswa,
    nama_mahasiswa: mhs.nama_mahasiswa,

    fakultas: mhs.prodi?.unit?.nama_unit ?? "-",
    prodi: mhs.prodi?.nama_prodi ?? "-",

    tahunLulus: mhs.tahun_lulus ? String(mhs.tahun_lulus) : "-",
    tahun_lulus: mhs.tahun_lulus,

    batch: mhs.batch_upload?.nomor_batch_upload ?? "-",
    id_batch_upload: mhs.id_batch_upload,
    batch_code: mhs.batch_upload?.uuid ?? null,

    tempatLahir: mhs.tempat_lahir,
    tempat_lahir: mhs.tempat_lahir,

    tanggalLahir: mhs.tanggal_lahir,
    tanggal_lahir: mhs.tanggal_lahir,

    jenisKelamin: mhs.jenis_kelamin,
    jenis_kelamin: mhs.jenis_kelamin,

    email: mhs.email,

    noTelp: mhs.telepon,
    telepon: mhs.telepon,

    tahunMasuk: mhs.tahun_masuk,
    tahun_masuk: mhs.tahun_masuk,

    ipk: mhs.ipk,
    predikat: mhs.predikat,

    judulSkripsi: mhs.judul_skripsi,
    judul_skripsi: mhs.judul_skripsi,

    statusKelulusan: mhs.status_kelulusan,
    status_kelulusan: mhs.status_kelulusan,

    tanggalKelulusan: mhs.tanggal_kelulusan,
    tanggal_kelulusan: mhs.tanggal_kelulusan,
  };
}

async function getUploadedMahasiswaPaginated(params: {
  mahasiswaIds: number[];
  page: number;
  limit: number;
}) {
  const { mahasiswaIds } = params;
  const { page, limit } = normalizePageLimit(params.page, params.limit);

  const total = mahasiswaIds.length;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const paginatedIds = mahasiswaIds.slice(skip, skip + limit);

  if (paginatedIds.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  const mahasiswa = await prisma.mahasiswa.findMany({
    where: {
      id_mahasiswa: {
        in: paginatedIds,
      },
    },
    include: {
      prodi: {
        include: {
          unit: true,
        },
      },
      batch_upload: {
        select: {
          id_batch_upload: true,
          uuid: true,
          nomor_batch_upload: true,
          periode: true,
          tahun_lulus: true,
        },
      },
    },
    orderBy: {
      nama_mahasiswa: "asc",
    },
  });

  return {
    data: mahasiswa.map((mhs: any) => mapMahasiswaResponse(mhs)),
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };
}

// ─────────────────────────────────────────────
// 1. UPLOAD FILE EXCEL & PROSES DATA
// ─────────────────────────────────────────────
export async function processUpload(params: {
  filePath: string;
  namaFile: string;
  uploadedBy: number;
  periode: "semester ganjil" | "semester genap";
  tahunLulus: number;
  idTemplate?: number;
  page?: number;
  limit?: number;
}) {
  const { filePath, namaFile, uploadedBy, periode, tahunLulus, idTemplate } =
    params;

  const { page, limit } = normalizePageLimit(params.page, params.limit);

  const { valid, errors, unknown_columns } = parseExcelFile(filePath);

  if (unknown_columns.length > 0) {
    return {
      ditolak: true,
      alasan: "File Excel mengandung kolom yang tidak dikenal.",
      unknown_columns,
      batches: [],
      mahasiswa: {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0,
        },
      },
    };
  }

  const periodeEnum =
    periode === "semester ganjil"
      ? ("semester_ganjil" as const)
      : ("semester_genap" as const);

  const { validatedRows: prodiValidated, prodiErrors } =
    await validateProdi(valid);

  const fakultasValidation = validateSatuFakultasDalamFile(prodiValidated);

  if (!fakultasValidation.valid) {
    const allErrors: ImportError[] = [
      ...errors,
      ...prodiErrors,
      ...fakultasValidation.fakultasErrors,
    ];

    return {
      ditolak: true,
      alasan:
        "File Excel ditolak karena berisi lebih dari 1 fakultas. Dalam 1 file Excel hanya boleh ada 1 fakultas.",
      fakultas_utama: fakultasValidation.fakultasUtama,
      total_data_excel: valid.length + errors.length,
      total_valid: 0,
      total_gagal: allErrors.length,
      total_batch: 0,
      errors: allErrors.sort((a, b) => a.row - b.row),
      batches: [],
      mahasiswa: {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0,
        },
      },
    };
  }

  const { uniqueRows, duplikatErrors } = await validateDuplikat(prodiValidated);

  const allErrors: ImportError[] = [
    ...errors,
    ...prodiErrors,
    ...duplikatErrors,
  ];

  const chunks = chunkArray(uniqueRows, BATCH_SIZE);
  const batchResults: {
    batch_ke: number;
    id_batch_upload: number;
    batch_code?: string | null;
    nomor_batch_upload: string | null;
    record_berhasil: number;
    record_gagal: number;
  }[] = [];

  const insertedMahasiswaIds: number[] = [];

  const firstResolvedRow = uniqueRows[0] as ResolvedMahasiswaRow | undefined;
  const namaFakultasUpload = firstResolvedRow?._resolved_nama_fakultas ?? null;
  const nextBatchNumber = await getNextBatchNumberByFakultas(namaFakultasUpload);

  for (const [index, chunk] of chunks.entries()) {
    const batchNumber = nextBatchNumber + index;

    const batch = await prisma.batch_upload.create({
      data: {
        nomor_batch_upload: generateNomorBatch({
          batchKe: batchNumber,
          namaFakultas: namaFakultasUpload,
        }),
        nama_file:
          chunks.length > 1
            ? `${namaFile} (batch ${index + 1}/${chunks.length})`
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

    const insertResults = await insertMahasiswaBatch(
      chunk,
      batch.id_batch_upload,
    );

    insertedMahasiswaIds.push(...insertResults.insertedIds);

    await prisma.batch_upload.update({
      where: {
        id_batch_upload: batch.id_batch_upload,
      },
      data: {
        record_berhasil: insertResults.berhasil,
        record_gagal: insertResults.gagal,
        log_error:
          insertResults.insertErrors.length > 0
            ? JSON.stringify(insertResults.insertErrors)
            : null,
      },
    });

    allErrors.push(...insertResults.insertErrors);

    batchResults.push({
      batch_ke: batchNumber,
      id_batch_upload: batch.id_batch_upload,
      batch_code: (batch as { uuid?: string | null }).uuid ?? null,
      nomor_batch_upload: batch.nomor_batch_upload,
      record_berhasil: insertResults.berhasil,
      record_gagal: insertResults.gagal,
    });
  }

  const totalBerhasil = batchResults.reduce(
    (sum, batch) => sum + batch.record_berhasil,
    0,
  );

  const uploadedMahasiswa = await getUploadedMahasiswaPaginated({
    mahasiswaIds: insertedMahasiswaIds,
    page,
    limit,
  });

  return {
    ditolak: false,
    total_data_excel: valid.length + errors.length,
    total_valid: totalBerhasil,
    total_gagal: allErrors.length,
    total_batch: chunks.length,
    errors: allErrors.sort((a, b) => a.row - b.row),
    batches: batchResults,
    mahasiswa: uploadedMahasiswa,
  };
}

// ─────────────────────────────────────────────
// HELPER — Validasi duplikat NIM, NIK, Nomor Seri Ijazah
// ─────────────────────────────────────────────
async function validateDuplikat(rows: MahasiswaRow[]): Promise<{
  uniqueRows: MahasiswaRow[];
  duplikatErrors: ImportError[];
}> {
  const duplikatErrors: ImportError[] = [];

  const nimCount: Record<string, number[]> = {};
  const nikCount: Record<string, number[]> = {};
  const nomorIjazahCount: Record<string, number[]> = {};

  const getNamaMahasiswa = (row?: MahasiswaRow) => {
    return row?.nama_mahasiswa ? String(row.nama_mahasiswa).trim() : null;
  };

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;
    const nim = String(row.nim).trim();

    if (!nimCount[nim]) {
      nimCount[nim] = [];
    }

    nimCount[nim].push(rowNum);

    if (row.nik) {
      const nik = String(row.nik).trim();

      if (!nikCount[nik]) {
        nikCount[nik] = [];
      }

      nikCount[nik].push(rowNum);
    }

    if (row.nomor_seri_ijazah) {
      const nomorIjazah = String(row.nomor_seri_ijazah).trim();

      if (!nomorIjazahCount[nomorIjazah]) {
        nomorIjazahCount[nomorIjazah] = [];
      }

      nomorIjazahCount[nomorIjazah].push(rowNum);
    }
  }

  const nimDuplikatDalamFile = new Set<string>();

  for (const [nim, baris] of Object.entries(nimCount)) {
    if (baris.length > 1) {
      nimDuplikatDalamFile.add(nim);

      for (const rowNum of baris) {
        const row = rows[rowNum - 2];

        duplikatErrors.push(
          buildImportError({
            row: rowNum,
            nim,
            nama_mahasiswa: getNamaMahasiswa(row),
            field: "nim",
            message: `NIM '${nim}' muncul ${baris.length}x dalam file (baris ${baris.join(
              ", ",
            )}). Semua baris dengan NIM ini ditolak.`,
          }),
        );
      }
    }
  }

  const nikDuplikatDalamFile = new Set<string>();

  for (const [nik, baris] of Object.entries(nikCount)) {
    if (baris.length > 1) {
      nikDuplikatDalamFile.add(nik);

      for (const rowNum of baris) {
        const row = rows[rowNum - 2];

        duplikatErrors.push(
          buildImportError({
            row: rowNum,
            nim: row ? String(row.nim).trim() : null,
            nama_mahasiswa: getNamaMahasiswa(row),
            field: "nik",
            message: `NIK '${nik}' muncul ${baris.length}x dalam file (baris ${baris.join(
              ", ",
            )}). Semua baris dengan NIK ini ditolak.`,
          }),
        );
      }
    }
  }

  const nomorIjazahDuplikatDalamFile = new Set<string>();

  for (const [nomorIjazah, baris] of Object.entries(nomorIjazahCount)) {
    if (baris.length > 1) {
      nomorIjazahDuplikatDalamFile.add(nomorIjazah);

      for (const rowNum of baris) {
        const row = rows[rowNum - 2];

        duplikatErrors.push(
          buildImportError({
            row: rowNum,
            nim: row ? String(row.nim).trim() : null,
            nama_mahasiswa: getNamaMahasiswa(row),
            field: "nomor_seri_ijazah",
            message: `Nomor seri ijazah '${nomorIjazah}' muncul ${baris.length}x dalam file (baris ${baris.join(
              ", ",
            )}). Semua baris dengan nomor ini ditolak.`,
          }),
        );
      }
    }
  }

  const lolosFile = rows.filter((row, index) => {
    const rowNum = index + 2;

    const nim = String(row.nim).trim();
    const nik = row.nik ? String(row.nik).trim() : null;
    const nomorIjazah = row.nomor_seri_ijazah
      ? String(row.nomor_seri_ijazah).trim()
      : null;

    if (nimDuplikatDalamFile.has(nim)) return false;
    if (nik && nikDuplikatDalamFile.has(nik)) return false;
    if (nomorIjazah && nomorIjazahDuplikatDalamFile.has(nomorIjazah)) {
      return false;
    }

    const sudahAdaError = duplikatErrors.some((error) => error.row === rowNum);
    return !sudahAdaError;
  });

  const uniqueRows: MahasiswaRow[] = [];

  for (const [index, row] of lolosFile.entries()) {
    const rowNum = index + 2;

    const nim = String(row.nim).trim();
    const nik = row.nik ? String(row.nik).trim() : null;
    const nomorIjazah = row.nomor_seri_ijazah
      ? String(row.nomor_seri_ijazah).trim()
      : null;

    const existingNim = await prisma.mahasiswa.findUnique({
      where: {
        nim,
      },
      select: {
        nim: true,
      },
    });

    if (existingNim) {
      duplikatErrors.push(
        buildImportError({
          row: rowNum,
          nim,
          nama_mahasiswa: getNamaMahasiswa(row),
          field: "nim",
          message: `NIM '${nim}' sudah terdaftar di database dan tidak dapat diimport ulang.`,
        }),
      );
      continue;
    }

    if (nik) {
      const existingNik = await prisma.mahasiswa.findFirst({
        where: {
          nik,
        },
        select: {
          nim: true,
          nik: true,
        },
      });

      if (existingNik) {
        duplikatErrors.push(
          buildImportError({
            row: rowNum,
            nim,
            nama_mahasiswa: getNamaMahasiswa(row),
            field: "nik",
            message: `NIK '${nik}' sudah terdaftar di database (milik NIM '${existingNik.nim}') dan tidak dapat diimport ulang.`,
          }),
        );
        continue;
      }
    }

    if (nomorIjazah) {
      const existingIjazah = await prisma.mahasiswa.findFirst({
        where: {
          nomor_seri_ijazah: nomorIjazah,
        },
        select: {
          nim: true,
          nomor_seri_ijazah: true,
        },
      });

      if (existingIjazah) {
        duplikatErrors.push(
          buildImportError({
            row: rowNum,
            nim,
            nama_mahasiswa: getNamaMahasiswa(row),
            field: "nomor_seri_ijazah",
            message: `Nomor seri ijazah '${nomorIjazah}' sudah terdaftar di database (milik NIM '${existingIjazah.nim}') dan tidak dapat diimport ulang.`,
          }),
        );
        continue;
      }
    }

    uniqueRows.push(row);
  }

  return {
    uniqueRows,
    duplikatErrors,
  };
}
// ─────────────────────────────────────────────
// HELPER — Validasi nama_prodi ke DB
// ─────────────────────────────────────────────
async function validateProdi(rows: MahasiswaRow[]): Promise<{
  validatedRows: ResolvedMahasiswaRow[];
  prodiErrors: ImportError[];
}> {
  const prodiCache: Record<
    string,
    { id_prodi: number; nama_fakultas: string | null } | null
  > = {};

  const validatedRows: ResolvedMahasiswaRow[] = [];
  const prodiErrors: ImportError[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;

    if (!row.nama_prodi) {
      validatedRows.push(row as ResolvedMahasiswaRow);
      continue;
    }

    const namaProdi = row.nama_prodi.trim();

    if (!(namaProdi in prodiCache)) {
      const prodi = await prisma.prodi.findFirst({
        where: {
          nama_prodi: {
            equals: namaProdi,
            mode: "insensitive",
          },
        },
        select: {
          id_prodi: true,
          unit: {
            select: {
              nama_unit: true,
            },
          },
        },
      });

      prodiCache[namaProdi] = prodi
        ? {
            id_prodi: prodi.id_prodi,
            nama_fakultas: prodi.unit?.nama_unit ?? null,
          }
        : null;
    }

    const prodiData = prodiCache[namaProdi];

    if (prodiData === null) {
      prodiErrors.push(
        buildImportError({
          row: rowNum,
          nim: String(row.nim),
          nama_mahasiswa: row.nama_mahasiswa
            ? String(row.nama_mahasiswa).trim()
            : null,
          field: "nama_prodi",
          message: `Prodi '${namaProdi}' tidak ditemukan di database. Periksa penulisan nama prodi.`,
        }),
      );

      continue;
    }

    const resolvedRow = row as ResolvedMahasiswaRow;
    resolvedRow._resolved_id_prodi = prodiData.id_prodi;
    resolvedRow._resolved_nama_fakultas = prodiData.nama_fakultas;

    validatedRows.push(resolvedRow);
  }

  return {
    validatedRows,
    prodiErrors,
  };
}

function validateSatuFakultasDalamFile(rows: ResolvedMahasiswaRow[]): {
  valid: boolean;
  fakultasUtama: string | null;
  fakultasErrors: ImportError[];
} {
  const fakultasErrors: ImportError[] = [];

  const fakultasGroups: Record<
    string,
    {
      nama_fakultas: string;
      rows: {
        row: number;
        nim: string | null;
        nama_mahasiswa: string | null;
        nama_prodi: string | null;
      }[];
    }
  > = {};

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;
    const namaFakultas = row._resolved_nama_fakultas?.trim();

    if (!namaFakultas) {
      continue;
    }

    const key = namaFakultas.toLowerCase();

    if (!fakultasGroups[key]) {
      fakultasGroups[key] = {
        nama_fakultas: namaFakultas,
        rows: [],
      };
    }

    fakultasGroups[key].rows.push({
      row: rowNum,
      nim: row.nim ? String(row.nim).trim() : null,
      nama_mahasiswa: row.nama_mahasiswa
        ? String(row.nama_mahasiswa).trim()
        : null,
      nama_prodi: row.nama_prodi ? String(row.nama_prodi).trim() : null,
    });
  }

  const groups = Object.values(fakultasGroups);

  if (groups.length <= 1) {
    return {
      valid: true,
      fakultasUtama: groups[0]?.nama_fakultas ?? null,
      fakultasErrors: [],
    };
  }

  const sortedGroups = [...groups].sort((a, b) => b.rows.length - a.rows.length);
  const fakultasUtama = sortedGroups[0]?.nama_fakultas ?? null;

  for (const group of groups) {
    if (group.nama_fakultas === fakultasUtama) {
      continue;
    }

    for (const item of group.rows) {
      fakultasErrors.push(
        buildImportError({
          row: item.row,
          nim: item.nim,
          nama_mahasiswa: item.nama_mahasiswa,
          field: "fakultas",
          message: `Data berbeda fakultas. Fakultas utama file adalah '${fakultasUtama}', tetapi baris ini berasal dari '${group.nama_fakultas}' melalui prodi '${item.nama_prodi ?? "-"}'. Dalam 1 file Excel hanya boleh ada 1 fakultas.`,
        }),
      );
    }
  }

  return {
    valid: false,
    fakultasUtama,
    fakultasErrors,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type BatchUploadNumberRow = {
  nomor_batch_upload: string | null;
};

async function getNextBatchNumberByFakultas(
  namaFakultas?: string | null,
): Promise<number> {
  const kodeFakultas = getSingkatanFakultas(namaFakultas);

  const batches: BatchUploadNumberRow[] = await prisma.batch_upload.findMany({
    where: {
      nomor_batch_upload: {
        endsWith: `-${kodeFakultas}`,
        mode: "insensitive",
      },
    },
    select: {
      nomor_batch_upload: true,
    },
  });

  const regex = new RegExp(`^Batch-(\\d+)-${kodeFakultas}$`, "i");

  const lastNumber = batches.reduce<number>(
    (max: number, batch: BatchUploadNumberRow) => {
      const nomorBatch = batch.nomor_batch_upload ?? "";
      const match = nomorBatch.match(regex);

      if (!match) {
        return max;
      }

      const batchNumber = Number(match[1]);

      if (Number.isNaN(batchNumber)) {
        return max;
      }

      return Math.max(max, batchNumber);
    },
    0,
  );

  return lastNumber + 1;
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
// 2. INSERT MAHASISWA
// ─────────────────────────────────────────────
async function insertMahasiswaBatch(
  rows: MahasiswaRow[],
  idBatchUpload: number,
): Promise<{
  berhasil: number;
  gagal: number;
  insertedIds: number[];
  insertErrors: ImportError[];
}> {
  let berhasil = 0;
  let gagal = 0;

  const insertedIds: number[] = [];
  const insertErrors: ImportError[] = [];

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2;
    const nim = String(row.nim).trim();

    try {
      const resolvedIdProdi =
        (row as MahasiswaRow & { _resolved_id_prodi?: number })
          ._resolved_id_prodi ?? null;

      const created = await prisma.mahasiswa.create({
        data: {
          nim,
          id_batch_upload: idBatchUpload,

          nik: row.nik ? String(row.nik).trim() : null,
          nomor_seri_ijazah: row.nomor_seri_ijazah
            ? String(row.nomor_seri_ijazah).trim()
            : null,
          pisn: row.pisn ? String(row.pisn).trim() : null,

          nama_mahasiswa: String(row.nama_mahasiswa).trim(),
          tempat_lahir: row.tempat_lahir
            ? String(row.tempat_lahir).trim()
            : null,
          tanggal_lahir: row.tanggal_lahir
            ? parseDate(row.tanggal_lahir)
            : null,

          program: row.program ? String(row.program).trim() : null,
          program_en: row.program_en ? String(row.program_en).trim() : null,

          gelar: row.gelar ? String(row.gelar).trim() : null,
          gelar_en: row.gelar_en ? String(row.gelar_en).trim() : null,

          jenis_kelamin: row.jenis_kelamin
            ? String(row.jenis_kelamin).trim()
            : null,
          telepon: row.telepon ? String(row.telepon).trim() : null,
          email: row.email ? String(row.email).trim() : null,
          foto: row.foto ? String(row.foto).trim() : null,

          ipk: row.ipk != null ? Number(row.ipk) : null,
          predikat: row.predikat ? String(row.predikat).trim() : null,

          judul_skripsi: row.judul_skripsi
            ? String(row.judul_skripsi).trim()
            : null,

          tahun_masuk: row.tahun_masuk ? Number(row.tahun_masuk) : null,
          tahun_lulus: row.tahun_lulus ? Number(row.tahun_lulus) : null,

          status_kelulusan: row.status_kelulusan
            ? String(row.status_kelulusan).trim()
            : null,
          tanggal_kelulusan: row.tanggal_kelulusan
            ? parseDate(row.tanggal_kelulusan)
            : null,

          ...(resolvedIdProdi ? { id_prodi: resolvedIdProdi } : {}),
        },
        select: {
          id_mahasiswa: true,
        },
      });

      insertedIds.push(created.id_mahasiswa);
      berhasil++;
    } catch (err) {
      gagal++;

      const errMsg = err instanceof Error ? err.message : String(err);

      let field = "nim";
      let pesanError = `Gagal menyimpan data NIM '${nim}'.`;

      if (errMsg.includes("nomor_seri_ijazah")) {
        field = "nomor_seri_ijazah";
        pesanError = `Nomor seri ijazah '${row.nomor_seri_ijazah}' sudah terdaftar di database.`;
      } else if (errMsg.includes("nik")) {
        field = "nik";
        pesanError = `NIK '${row.nik}' sudah terdaftar di database.`;
      } else if (errMsg.includes("pisn")) {
        field = "pisn";
        pesanError = `PISN '${row.pisn}' sudah terdaftar di database.`;
      } else if (errMsg.includes("nim")) {
        field = "nim";
        pesanError = `NIM '${nim}' sudah terdaftar di database.`;
      }

      insertErrors.push(
        buildImportError({
          row: rowNum,
          nim,
          nama_mahasiswa: row.nama_mahasiswa ? String(row.nama_mahasiswa).trim() : null,
          field,
          message: pesanError,
        }),
      );
    }
  }

  return {
    berhasil,
    gagal,
    insertedIds,
    insertErrors,
  };
}

// ─────────────────────────────────────────────
// 3. STATUS UPLOAD
// ─────────────────────────────────────────────
export async function getStatusUpload(idBatchUpload: number) {
  const batch = await prisma.batch_upload.findUnique({
    where: {
      id_batch_upload: idBatchUpload,
    },
    include: {
      users: {
        select: {
          id_user: true,
          email: true,
          role: true,
        },
      },
      template: {
        select: {
          id_template: true,
          jenis_template: true,
        },
      },
      mahasiswa: {
        include: {
          prodi: {
            include: {
              unit: true,
            },
          },
        },
        orderBy: {
          nama_mahasiswa: "asc",
        },
      },
    },
  });

  if (!batch) return null;

  return {
    ...batch,
    mahasiswa: batch.mahasiswa.map((mhs: any) => mapMahasiswaResponse(mhs)),
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
  const { page, limit } = normalizePageLimit(params.page, params.limit);
  const { uploadedBy, tahunLulus, periode } = params;

  const skip = (page - 1) * limit;

  const where: any = {};

  if (uploadedBy) {
    where.uploaded_by = uploadedBy;
  }

  if (tahunLulus) {
    where.tahun_lulus = tahunLulus;
  }

  if (periode) {
    where.periode = periode;
  }

  const [data, total] = await Promise.all([
    prisma.batch_upload.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      include: {
        users: {
          select: {
            id_user: true,
            email: true,
          },
        },
        template: {
          select: {
            id_template: true,
            jenis_template: true,
          },
        },
      },
    }),
    prisma.batch_upload.count({
      where,
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

// ─────────────────────────────────────────────
// 5. GENERATE TEMPLATE EXCEL
// ─────────────────────────────────────────────
export function generateTemplateExcel(): Buffer {
  const headers = [
    "nim",
    "nik",
    "nomor_seri_ijazah",
    "pisn",
    "nama_mahasiswa",
    "tempat_lahir",
    "tanggal_lahir",
    "program",
    "program_en",
    "gelar",
    "gelar_en",
    "jenis_kelamin",
    "telepon",
    "email",
    "foto",
    "ipk",
    "predikat",
    "judul_skripsi",
    "tahun_masuk",
    "tahun_lulus",
    "status_kelulusan",
    "tanggal_kelulusan",
    "nama_prodi",
  ];

  const exampleRow = [
    "2021001001",
    "3201010101010001",
    "DN/2024/0001",
    "",
    "Budi Santoso",
    "Jakarta",
    "2000-01-15",
    "S1",
    "Bachelor",
    "S.Kom.",
    "S.Kom.",
    "Laki-laki",
    "08123456789",
    "budi@email.com",
    "https://example.com/foto/budi.jpg",
    "3.75",
    "Sangat Memuaskan",
    "Analisis Sistem Informasi Berbasis AI",
    "2021",
    "2025",
    "Lulus",
    "2025-02-10",
    "Teknik Informatika",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

  ws["!cols"] = headers.map(() => ({
    wch: 22,
  }));

  XLSX.utils.book_append_sheet(wb, ws, "Data Mahasiswa");

  const petunjukData = [
    ["PETUNJUK PENGISIAN"],
    [""],
    ["1. Kolom nim dan nama_mahasiswa wajib diisi."],
    ["2. Format tanggal: YYYY-MM-DD atau DD/MM/YYYY."],
    ["3. IPK diisi dengan angka desimal, contoh: 3.75"],
    ["4. nama_prodi diisi sesuai nama prodi yang terdaftar di sistem."],
    ["5. Jenis kelamin: Laki-laki / Perempuan"],
    ["6. Jangan tambah atau ubah nama kolom di baris pertama."],
    ["7. Kolom yang tidak ada di template akan menyebabkan upload ditolak."],
    [
      "8. NIM, NIK, PISN, atau Nomor Seri Ijazah yang duplikat dalam file maupun di database tidak akan diimport.",
    ],
    [
      "9. Kolom foto diisi dengan URL atau base64 dari gambar profil mahasiswa.",
    ],
    [
      "10. Dalam 1 file Excel hanya boleh berisi mahasiswa dari 1 fakultas. Jika terdapat lebih dari 1 fakultas, seluruh file akan ditolak.",
    ],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
  wsPetunjuk["!cols"] = [
    {
      wch: 70,
    },
  ];

  XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

  return XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
  });
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

  if (!sheetName) {
    return {
      valid: false,
      missingColumns: [],
      unknownColumns: [],
      totalRows: 0,
    };
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return {
      valid: false,
      missingColumns: [],
      unknownColumns: [],
      totalRows: 0,
    };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  if (rows.length === 0) {
    return {
      valid: false,
      missingColumns: [],
      unknownColumns: [],
      totalRows: 0,
    };
  }

  const firstRow = rows[0];

  if (!firstRow) {
    return {
      valid: false,
      missingColumns: [],
      unknownColumns: [],
      totalRows: 0,
    };
  }

  const ALLOWED_COLUMNS = [
    "nim",
    "nik",
    "nomor_seri_ijazah",
    "pisn",
    "nama_mahasiswa",
    "tempat_lahir",
    "tanggal_lahir",
    "program",
    "program_en",
    "gelar",
    "gelar_en",
    "jenis_kelamin",
    "telepon",
    "email",
    "foto",
    "ipk",
    "predikat",
    "judul_skripsi",
    "tahun_masuk",
    "tahun_lulus",
    "status_kelulusan",
    "tanggal_kelulusan",
    "nama_prodi",
  ];

  const headers = Object.keys(firstRow).map((header) =>
    header.toLowerCase().trim().replace(/\s+/g, "_"),
  );

  const missingColumns = ["nim", "nama_mahasiswa"].filter(
    (column) => !headers.includes(column),
  );

  const unknownColumns = headers.filter(
    (header) => !ALLOWED_COLUMNS.includes(header),
  );

  return {
    valid: missingColumns.length === 0 && unknownColumns.length === 0,
    missingColumns,
    unknownColumns,
    totalRows: rows.length,
  };
}

// ─────────────────────────────────────────────
// 7. GET MAHASISWA BY BATCH IDS
// ─────────────────────────────────────────────
export async function getMahasiswaByBatchIds(params: {
  batchIds: number[];
  page: number;
  limit: number;
  search?: string;
  fakultas?: string;
  tahunLulus?: number;
}) {
  const { batchIds, search, fakultas, tahunLulus } = params;
  const { page, limit } = normalizePageLimit(params.page, params.limit);

  const skip = (page - 1) * limit;

  const where: any = {
    id_batch_upload: {
      in: batchIds,
    },
  };

  if (tahunLulus) {
    where.tahun_lulus = tahunLulus;
  }

  if (fakultas && fakultas.trim() !== "" && fakultas !== "Semua Fakultas") {
    where.prodi = {
      is: {
        unit: {
          is: {
            nama_unit: fakultas.trim(),
          },
        },
      },
    };
  }

  if (search && search.trim() !== "") {
  const keyword = search.trim();

  where.OR = [
    {
      nama_mahasiswa: {
        contains: keyword,
        mode: "insensitive",
      },
    },
    {
      nim: {
        contains: keyword,
        mode: "insensitive",
      },
    },
    {
      prodi: {
        is: {
          nama_prodi: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      },
    },
  ];
}
  const [mahasiswaData, total] = await Promise.all([
    prisma.mahasiswa.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        nama_mahasiswa: "asc",
      },
      include: {
        prodi: {
          include: {
            unit: true,
          },
        },
        batch_upload: {
          select: {
            id_batch_upload: true,
            nomor_batch_upload: true,
            periode: true,
            tahun_lulus: true,
          },
        },
      },
    }),
    prisma.mahasiswa.count({
      where,
    }),
  ]);

  return {
    data: mahasiswaData.map((mhs: any) => mapMahasiswaResponse(mhs)),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}
