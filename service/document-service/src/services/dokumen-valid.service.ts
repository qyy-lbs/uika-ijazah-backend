import {
  findBatchesWithValidDocuments,
  findBatchWithValidDocumentsByCode,
} from "../repositories/dokumen-valid.repository.js";

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
      doc.jenis_dokumen?.toLowerCase() === "ijazah" &&
      doc.is_verified === true,
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
  page: number;
  limit: number;
}) {
  const batches = await findBatchesWithValidDocuments();

  const mapped = batches
    .map((batch) => {
      const validMahasiswa = batch.mahasiswa.filter(hasValidPublishedDocuments);
      const firstMahasiswa = validMahasiswa[0] ?? batch.mahasiswa[0];

      const fakultas = firstMahasiswa?.prodi?.unit?.nama_unit ?? "-";
      const tahun = batch.tahun_lulus ?? firstMahasiswa?.tahun_lulus ?? null;

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
      };
    })
    .filter((batch) => batch.total > 0);

  const filtered = mapped.filter((item) => {
    const search = query.search?.toLowerCase().trim() || "";
    const fakultas = query.fakultas?.toLowerCase().trim() || "";
    const tahun = query.tahun?.toString().trim() || "";

    const matchSearch =
      !search ||
      item.batch?.toLowerCase().includes(search) ||
      item.fakultas?.toLowerCase().includes(search) ||
      item.nama_file?.toLowerCase().includes(search);

    const matchFakultas =
      !fakultas || item.fakultas?.toLowerCase() === fakultas;

    const matchTahun = !tahun || String(item.tahun ?? "") === tahun;

    return matchSearch && matchFakultas && matchTahun;
  });

  const totalData = filtered.length;
  const totalPage = Math.ceil(totalData / query.limit) || 1;

  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;

  return {
    data: filtered.slice(startIndex, endIndex),
    pagination: {
      page: query.page,
      limit: query.limit,
      total_data: totalData,
      total_page: totalPage,
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
