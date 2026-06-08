import {
  getStatistikTahunanRepository,
  getStatistikValidasiRepository,
} from "../repositories/statistik.repository.js";

import {
  mapDashboardStatus,
} from "../helpers/dashboard.helper.js";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const getStatistikTahunanService = async () => {
  const rows = await getStatistikTahunanRepository();

  return (rows as any[]).map((item) => ({
    bulan: Number(item.bulan),
    nama_bulan: MONTH_NAMES[Number(item.bulan) - 1],
    tahun: Number(item.tahun),
    total: Number(item.total),
  }));
};

export const getStatistikValidasiService = async (
  year?: number
) => {
  const rows = await getStatistikValidasiRepository(year);

  const result = {
    terbit: 0,
    proses: 0,
    rejected: 0,
    revoked: 0,
  };

  (rows as any[]).forEach((item) => {
    const status = mapDashboardStatus({
      statusValidasi: item.status_validasi,
      hasVerifiedDocument: Boolean(item.has_verified_document),
    });

    if (status === "terbit") {
      result.terbit++;
    } else if (status === "rejected") {
      result.rejected++;
    } else if (status === "revoked") {
      result.revoked++;
    } else {
      result.proses++;
    }
  });

  return result;
};