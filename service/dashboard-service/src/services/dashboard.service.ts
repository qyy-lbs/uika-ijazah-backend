import {
  getLatestValidationRepository,
} from "../repositories/dashboard.repository.js";

import {
  mapDashboardStatus,
} from "../helpers/dashboard.helper.js";

export const getLatestValidationService = async (
  page: number,
  limit: number,
  search: string
) => {
  const result = await getLatestValidationRepository(
    page,
    limit,
    search
  );

  const rows = result.data as any[];

  const data = rows.map((item) => {
    const status = mapDashboardStatus({
      statusValidasi: item.status,
      hasVerifiedDocument: Boolean(item.has_verified_document),
    });

    return {
      id_mahasiswa: item.id_mahasiswa,
      nama: item.nama,
      nim: item.nim,

      fakultas: item.fakultas || "-",
      prodi: item.prodi || "-",

      tahun_lulus: item.tahun_lulus,

      id_batch_upload: item.id_batch_upload,
      nomor_batch_upload: item.nomor_batch_upload,
      batch: item.batch || item.nomor_batch_upload || "-",
      periode: item.periode || "-",

      status,
      status_asli: item.status,

      has_verified_document: Boolean(item.has_verified_document),
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total_data: result.total,
      total_page: Math.ceil(result.total / limit),
    },
  };
};

export const getDashboardSummaryService = async () => {
  const result = await getLatestValidationRepository(
    1,
    100000,
    ""
  );

  const rows = result.data as any[];

  const summary = {
    totalIjazahTerbit: 0,
    permintaanVerifikasi: 0,
    dataReject: 0,
    dataRevoke: 0,
  };

  rows.forEach((item) => {
    const status = mapDashboardStatus({
      statusValidasi: item.status,
      hasVerifiedDocument: Boolean(item.has_verified_document),
    });

    if (status === "terbit") {
      summary.totalIjazahTerbit++;
    } else if (status === "rejected") {
      summary.dataReject++;
    } else if (status === "revoked") {
      summary.dataRevoke++;
    } else {
      summary.permintaanVerifikasi++;
    }
  });

  return summary;
};