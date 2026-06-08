import {
  getBatchDashboardRepository,
  getDetailBatchRepository,
  getBatchRepository,
} from "../repositories/batch.repository.js";

const normalizeStatus = (status?: string | null) => {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (
    value === "reject" ||
    value === "rejected" ||
    value === "ditolak"
  ) {
    return "rejected";
  }

  if (
    value === "revoke" ||
    value === "revoked" ||
    value === "dicabut"
  ) {
    return "revoked";
  }

  if (
    value === "terbit" ||
    value === "valid" ||
    value === "verified"
  ) {
    return "terbit";
  }

  if (
    value === "approved" ||
    value === "approve" ||
    value === "proses" ||
    value === "pending"
  ) {
    return "proses";
  }

  return value || "proses";
};

export const getBatchDashboardService = async () => {
  const rows = await getBatchDashboardRepository();

  return (rows as any[]).map((item) => ({
    id_batch_upload: item.id_batch_upload,
    nomor_batch_upload: item.nomor_batch_upload,
    tahun_lulus: item.tahun_lulus,
    periode: item.periode,

    total_mahasiswa: Number(item.total_mahasiswa),
    proses: Number(item.proses),
    rejected: Number(item.rejected),
    revoked: Number(item.revoked),
    terbit: Number(item.terbit),
  }));
};

export const getDetailBatchService = async (
  id: number,
  status?: string
) => {
  const rows: any = await getDetailBatchRepository(id);

  if (!rows.length) {
    return null;
  }

  const requestedStatus = normalizeStatus(status);

  let mahasiswa = rows
    .filter((item: any) => item.id_mahasiswa)
    .map((item: any) => {
      const rawStatus =
        item.status ||
        item.status_validasi ||
        "proses";

      const mappedStatus = normalizeStatus(rawStatus);

      return {
        id_mahasiswa: item.id_mahasiswa,

        nama: item.nama,
        nama_mahasiswa: item.nama,

        nim: item.nim,

        prodi: item.prodi || "-",
        program_studi: item.program_studi || item.prodi || "-",

        fakultas: item.fakultas || "-",

        tahun_lulus: item.tahun_lulus,
        tahun: item.tahun_lulus,

        status: mappedStatus,
        status_asli: rawStatus,
      };
    });

  if (status) {
    mahasiswa = mahasiswa.filter((mhs: any) => {
      return mhs.status === requestedStatus;
    });
  }

  return {
    id_batch_upload: rows[0].id_batch_upload,
    nomor_batch_upload: rows[0].nomor_batch_upload,
    tahun_lulus: rows[0].tahun_lulus,
    periode: rows[0].periode,
    fakultas: rows[0].fakultas || "-",
    mahasiswa,
  };
};

export const getBatchService = async (
  page: number,
  limit: number,
  tahun_lulus?: string,
  periode?: string,
  search?: string,
  status?: string
) => {
  const result =
    await getBatchRepository(
      page,
      limit,
      tahun_lulus,
      periode,
      search,
      status
    );

  const data = result.data as {
    id_batch_upload: number;
    nomor_batch_upload: string;
    tahun_lulus: number;
    periode: string;
    fakultas: string;
    total_mahasiswa: bigint;
  }[];

  const totalRows: any =
    result.total as {
      total: bigint;
    }[];

  const totalData =
    Number(totalRows[0]?.total || 0);

  return {
    data: data.map((item) => ({
      ...item,
      total_mahasiswa:
        Number(item.total_mahasiswa),
    })),

    pagination: {
      page,
      limit,
      total_data: totalData,
      total_page:
        Math.ceil(totalData / limit),
    },
  };
};