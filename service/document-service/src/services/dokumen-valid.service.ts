import {
  findBatchesWithValidDocuments,
  findBatchWithValidDocumentsByCode,
} from "../repositories/dokumen-valid.repository.js";
import prisma from "../prisma/prisma.js";

type MahasiswaWithDokumen = Awaited<
  ReturnType<typeof findBatchesWithValidDocuments>
>[number]["mahasiswa"][number];

function buildFileUrl(filePath: string | null | undefined) {
  if (!filePath) return null;

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  if (filePath.startsWith("/")) {
    return `${baseUrl}${filePath}`;
  }

  return `${baseUrl}/${filePath}`;
}

function getPublishedDocuments(mahasiswa: MahasiswaWithDokumen) {
  const documents = Array.isArray(mahasiswa.dokumen) ? mahasiswa.dokumen : [];

  const ijazah = documents.find(
    (doc) =>
      doc.jenis_dokumen?.toLowerCase() === "ijazah" && doc.is_verified === true,
  );

  const transkrip = documents.find(
    (doc) =>
      doc.jenis_dokumen?.toLowerCase() === "transkrip" &&
      doc.is_verified === true,
  );

  return {
    ijazah,
    transkrip,
  };
}

function hasValidPublishedDocuments(mahasiswa: MahasiswaWithDokumen) {
  const { ijazah, transkrip } = getPublishedDocuments(mahasiswa);

  return Boolean(ijazah && transkrip);
}
function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}
function sortByBatchNameAsc<
  T extends {
    batch?: string | null;
    nomor_batch_upload?: string | null;
  },
>(data: T[]) {
  return [...data].sort((a, b) => {
    const nameA = String(a.batch || a.nomor_batch_upload || "");
    const nameB = String(b.batch || b.nomor_batch_upload || "");

    return nameA.localeCompare(nameB, "id", {
      numeric: true,
      sensitivity: "base",
    });
  });
}
function getMahasiswaSearchText(mahasiswa: MahasiswaWithDokumen) {
  return [
    mahasiswa.nama_mahasiswa,
    mahasiswa.nim,
    mahasiswa.prodi?.nama_prodi,
    mahasiswa.prodi?.unit?.nama_unit,
    mahasiswa.tahun_lulus,
  ]
    .map(normalizeSearchText)
    .filter(Boolean)
    .join(" ");
}
function normalizeStatusEmail(status: string | null | undefined) {
  const raw = String(status || "").toLowerCase();

  if (raw.includes("terkirim") && !raw.includes("belum")) {
    return "Terkirim";
  }

  return "Belum Terkirim";
}
function isMahasiswaMatchSearch(
  mahasiswa: MahasiswaWithDokumen,
  search: string,
) {
  if (!search) return false;

  return getMahasiswaSearchText(mahasiswa).includes(search);
}

function mapMahasiswaMatch(mahasiswa: MahasiswaWithDokumen) {
  return {
    id_mahasiswa: mahasiswa.id_mahasiswa,
    mahasiswa_code: mahasiswa.uuid,
    uuid: mahasiswa.uuid,
    nama: mahasiswa.nama_mahasiswa,
    nama_mahasiswa: mahasiswa.nama_mahasiswa,
    nim: mahasiswa.nim,
    prodi: mahasiswa.prodi?.nama_prodi ?? "-",
    program_studi: mahasiswa.prodi?.nama_prodi ?? "-",
    fakultas: mahasiswa.prodi?.unit?.nama_unit ?? "-",
    tahun_lulus: mahasiswa.tahun_lulus ?? null,
  };
}

function formatPeriode(periode: string | null | undefined) {
  if (!periode) return "-";

  return periode
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapDocument(doc: ReturnType<typeof getPublishedDocuments>["ijazah"]) {
  if (!doc) return null;

  return {
    id_dokumen: doc.id_dokumen,
    document_code: doc.kode_qr,
    nomor_dokumen: doc.nomor_dokumen,
    tanggal_terbit: doc.tanggal_terbit,
    kode_qr: doc.kode_qr,
    url_akses: doc.url_akses,
    file_pdf: doc.file_pdf,
    file_pdf_final: doc.file_pdf_final,
    file_pdf_url: buildFileUrl(doc.file_pdf_final || doc.file_pdf),
  };
}

export async function getValidDocumentBatches(query: {
  search?: string;
  fakultas?: string;
  tahun?: string;
  status_email?: string;
  page: number;
  limit: number;
}) {
  const batches = await findBatchesWithValidDocuments();

  const emailLogs = await prisma.log_aktivitas.findMany({
    where: {
      aktivitas: "SEND_EMAIL_BATCH",
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const sentBatchMap = new Map<string, string>();

  for (const log of emailLogs) {
    try {
      const parsed = JSON.parse(log.deskripsi || "{}");
      const batchCode = parsed.batch_code;

      if (batchCode && !sentBatchMap.has(batchCode)) {
        const gagal = Number(parsed.gagal || 0);

        sentBatchMap.set(
          batchCode,
          gagal > 0 ? "Email Terkirim Sebagian" : "Email Terkirim",
        );
      }
    } catch {
      // skip log yang bukan JSON
    }
  }

  const searchKeyword = normalizeSearchText(query.search);
  const fakultasKeyword = normalizeSearchText(query.fakultas);
  const tahunKeyword = String(query.tahun ?? "").trim();
  const statusEmailKeyword = query.status_email
    ? normalizeSearchText(normalizeStatusEmail(query.status_email))
    : "";
  const mapped = batches
    .map((batch) => {
      const validMahasiswa = batch.mahasiswa.filter(hasValidPublishedDocuments);
      const firstMahasiswa = validMahasiswa[0] ?? batch.mahasiswa[0];

      const fakultas = firstMahasiswa?.prodi?.unit?.nama_unit ?? "-";
      const tahun = batch.tahun_lulus ?? firstMahasiswa?.tahun_lulus ?? null;

      const mahasiswaSearchText = validMahasiswa
        .map(getMahasiswaSearchText)
        .join(" ");

      const mahasiswaMatch = searchKeyword
        ? validMahasiswa
            .filter((mhs) => isMahasiswaMatchSearch(mhs, searchKeyword))
            .slice(0, 10)
            .map(mapMahasiswaMatch)
        : [];

      return {
        id: batch.id_batch_upload,
        id_batch_upload: batch.id_batch_upload,
        batch_code: batch.uuid,
        uuid: batch.uuid,
        batch: batch.nomor_batch_upload || `Batch ${batch.id_batch_upload}`,
        nomor_batch_upload: batch.nomor_batch_upload,
        nama_file: batch.nama_file,
        fakultas,
        tahun,
        periode: formatPeriode(batch.periode),
        total: validMahasiswa.length,
        created_at: batch.created_at,
        status_kirim: sentBatchMap.get(String(batch.uuid)) || "Belum Diemail",
        status_email: sentBatchMap.get(String(batch.uuid)) || "Belum Diemail",

        // Dipakai frontend untuk autocomplete mahasiswa
        mahasiswa_match: mahasiswaMatch,

        // Internal untuk search, tidak dikirim ke frontend
        _mahasiswa_search: mahasiswaSearchText,
      };
    })
    .filter((batch) => batch.total > 0);

  const filtered = mapped.filter((item) => {
    const batchSearchText = [
      item.batch,
      item.nomor_batch_upload,
      item.fakultas,
      item.nama_file,
      item.tahun,
      item.periode,
      item._mahasiswa_search,
    ]
      .map(normalizeSearchText)
      .filter(Boolean)
      .join(" ");

    const matchSearch =
      !searchKeyword || batchSearchText.includes(searchKeyword);

    const matchFakultas =
      !fakultasKeyword ||
      normalizeSearchText(item.fakultas) === fakultasKeyword;

    const matchTahun =
      !tahunKeyword || String(item.tahun ?? "") === tahunKeyword;

    const currentStatusEmail = normalizeSearchText(
      normalizeStatusEmail(item.status_email),
    );

    const matchStatusEmail =
      !statusEmailKeyword || currentStatusEmail === statusEmailKeyword;

    return matchSearch && matchFakultas && matchTahun && matchStatusEmail;
  });

  const fakultasOptions = Array.from(
    new Set(
      mapped
        .map((item) => item.fakultas)
        .filter((fakultas) => fakultas && fakultas !== "-"),
    ),
  ).sort((a, b) => a.localeCompare(b, "id"));
  const tahunOptions = Array.from(
    new Set(
      mapped
        .map((item) => item.tahun)
        .filter(
          (tahun) => tahun !== null && tahun !== undefined,
        ),
    ),
  )
    .map((tahun) => Number(tahun))
    .filter((tahun) => !Number.isNaN(tahun))
    .sort((a, b) => b - a);

  const sortedFiltered = sortByBatchNameAsc(filtered);

  const totalData = sortedFiltered.length;
  const totalPage = Math.ceil(totalData / query.limit) || 1;

  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;

  const paginatedData = sortedFiltered
    .slice(startIndex, endIndex)
    .map(({ _mahasiswa_search, ...item }) => item);

  return {
    data: paginatedData,
    pagination: {
      page: query.page,
      limit: query.limit,
      total_data: totalData,
      total_page: totalPage,
    },
    filter_options: {
      fakultas: fakultasOptions, tahun: tahunOptions,
    },
  };
}

export async function getValidDocumentBatchDetail(
  batchCode: string,
  query: {
    search?: string;
  },
) {
  const batch = await findBatchWithValidDocumentsByCode(batchCode);

  if (!batch) {
    throw new Error("Batch tidak ditemukan");
  }

  const validMahasiswa = batch.mahasiswa
    .filter(hasValidPublishedDocuments)
    .map((mhs) => {
      const { ijazah, transkrip } = getPublishedDocuments(mhs);

      return {
        id_mahasiswa: mhs.id_mahasiswa,
        mahasiswa_code: mhs.uuid,
        uuid: mhs.uuid,
        nama: mhs.nama_mahasiswa,
        nama_mahasiswa: mhs.nama_mahasiswa,
        nim: mhs.nim,
        prodi: mhs.prodi?.nama_prodi ?? "-",
        program_studi: mhs.prodi?.nama_prodi ?? "-",
        fakultas: mhs.prodi?.unit?.nama_unit ?? "-",
        tahun: mhs.tahun_lulus ?? batch.tahun_lulus ?? "-",
        tahun_lulus: mhs.tahun_lulus ?? batch.tahun_lulus ?? null,
        status: "Terbit",
        ijazah: mapDocument(ijazah),
        transkrip: mapDocument(transkrip),
      };
    });

  const search = query.search?.toLowerCase().trim() || "";

  const filteredMahasiswa = search
    ? validMahasiswa.filter(
        (mhs) =>
          mhs.nama?.toLowerCase().includes(search) ||
          mhs.nama_mahasiswa?.toLowerCase().includes(search) ||
          mhs.nim?.includes(search) ||
          mhs.prodi?.toLowerCase().includes(search) ||
          mhs.fakultas?.toLowerCase().includes(search),
      )
    : validMahasiswa;

  const firstMahasiswa = validMahasiswa[0];

  return {
    batch: {
      id: batch.id_batch_upload,
      id_batch_upload: batch.id_batch_upload,
      batch_code: batch.uuid,
      uuid: batch.uuid,
      batch: batch.nomor_batch_upload || `Batch ${batch.id_batch_upload}`,
      nomor_batch_upload: batch.nomor_batch_upload,
      nama_file: batch.nama_file,
      fakultas: firstMahasiswa?.fakultas ?? "-",
      tahun: batch.tahun_lulus ?? firstMahasiswa?.tahun_lulus ?? "-",
      periode: formatPeriode(batch.periode),
      total: validMahasiswa.length,
      created_at: batch.created_at,
    },
    mahasiswa: filteredMahasiswa,
  };
}
