import {
  getBatchDashboardRepository,
  getDetailBatchRepository,
  getBatchRepository,
} from "../repositories/batch.repository.js";

import { mapDashboardStatus } from "../helpers/dashboard.helper.js";

const normalizeFilterStatus = (status?: string | null) => {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (value === "reject" || value === "rejected" || value === "ditolak") {
    return "rejected";
  }

  if (value === "revoke" || value === "revoked" || value === "dicabut") {
    return "revoked";
  }

  if (value === "terbit" || value === "valid" || value === "verified") {
    return "terbit";
  }

  if (
    value === "proses" ||
    value === "pending" ||
    value === "approved" ||
    value === "approve"
  ) {
    return "proses";
  }

  return value || "proses";
};

export const getBatchDashboardService = async () => {
  const rows = await getBatchDashboardRepository();

  return (rows as any[]).map((item) => ({
    batch_code: item.batch_uuid ?? item.uuid ?? null,

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

export const getDetailBatchService = async (id: number, status?: string) => {
  const rows = (await getDetailBatchRepository(id)) as any[];
  if (!rows.length) {
    return null;
  }

  const requestedStatus = status ? normalizeFilterStatus(status) : "";

  let mahasiswa = rows
    .filter((item: any) => item.id_mahasiswa)
    .map((item: any) => {
      const rawStatus = item.status || item.status_validasi || "proses";

      const mappedStatus = mapDashboardStatus({
        statusValidasi: rawStatus,
        hasVerifiedDocument: Boolean(item.has_verified_document),
      });

      return {
        mahasiswa_code: item.mahasiswa_uuid ?? item.uuid ?? null,

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

        has_verified_document: Boolean(item.has_verified_document),
      };
    });

  if (requestedStatus) {
    mahasiswa = mahasiswa.filter((mhs: any) => {
      return normalizeFilterStatus(mhs.status) === requestedStatus;
    });
  }

  return {
    batch_code: rows[0].batch_uuid ?? rows[0].uuid ?? null,
    id_batch_upload: rows[0].id_batch_upload,

    nomor_batch_upload: rows[0].nomor_batch_upload,
    tahun_lulus: rows[0].tahun_lulus,
    periode: rows[0].periode,
    fakultas: rows[0].fakultas || "-",

    total_mahasiswa: mahasiswa.length,

    mahasiswa,
  };
};

export const getBatchService = async (
  page: number,
  limit: number,
  tahun_lulus?: string,
  periode?: string,
  search?: string,
  status?: string,
) => {
  const result = await getBatchRepository(
    page,
    limit,
    tahun_lulus,
    periode,
    search,
    status,
  );

  const data = result.data as {
  id_batch_upload: number;
  batch_uuid: string | null;
  uuid?: string | null;
  nomor_batch_upload: string;
  tahun_lulus: number;
  periode: string;
  fakultas: string;
  total_mahasiswa: bigint;
}[];

  const totalRows: any = result.total as {
    total: bigint;
  }[];

  const totalData = Number(totalRows[0]?.total || 0);

  return {
    data: data.map((item) => ({
      batch_code: item.batch_uuid ?? item.uuid ?? null,

      nomor_batch_upload: item.nomor_batch_upload,
      tahun_lulus: item.tahun_lulus,
      periode: item.periode,
      fakultas: item.fakultas,

      total_mahasiswa: Number(item.total_mahasiswa),
    })),

    pagination: {
      page,
      limit,
      total_data: totalData,
      total_page: Math.ceil(totalData / limit),
    },
  };
};
