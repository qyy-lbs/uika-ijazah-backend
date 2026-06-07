import {
  getBatchDashboardRepository,
  getDetailBatchRepository,
  getBatchRepository,
} from "../repositories/batch.repository.js";

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

  let mahasiswa = rows
    .filter((item: any) => item.id_mahasiswa)
    .map((item: any) => ({
      id_mahasiswa: item.id_mahasiswa,

      nama: item.nama,
      nama_mahasiswa: item.nama,

      nim: item.nim,

      prodi: item.prodi || "-",
      program_studi: item.program_studi || item.prodi || "-",

      fakultas: item.fakultas || "-",

      tahun_lulus: item.tahun_lulus,
      tahun: item.tahun_lulus,

      status: item.status || item.status_validasi || "proses",
    }));

  if (status) {
    mahasiswa = mahasiswa.filter((mhs: any) => {
      if (status === "proses") {
        return mhs.status === "proses";
      }

      if (status === "approved") {
        return mhs.status === "approved";
      }

      if (status === "rejected") {
        return mhs.status === "rejected";
      }

      if (status === "revoked") {
        return mhs.status === "revoked";
      }

      return true;
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
  search?: string
) => {

  const result =
    await getBatchRepository(
      page,
      limit,
      tahun_lulus,
      periode,
      search
    );

const data = result.data as {
  id_batch_upload: number;
  nomor_batch_upload: string;
  tahun_lulus: number;
  periode: string;
  fakultas: string;
  total_mahasiswa: bigint;
}[];

  const totalRows:any =
    result.total as {
      total: bigint;
    }[];

  const totalData =
    Number(totalRows[0].total);

  return {

    data: data.map((item) => ({
      ...item,
      total_mahasiswa:
        Number(item.total_mahasiswa)
    })),

    pagination: {
      page,
      limit,
      total_data: totalData,
      total_page:
        Math.ceil(totalData / limit)
    }
  };
};