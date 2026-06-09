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

  const currentYear = new Date().getFullYear();

  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
  ];

  const result = MONTH_NAMES.map((namaBulan) => {
    const row: Record<string, string | number> = {
      bulan: namaBulan,
    };

    years.forEach((year) => {
      row[String(year)] = 0;
    });

    return row;
  });

  (rows as any[]).forEach((item) => {
    const bulanIndex = Number(item.bulan) - 1;
    const tahun = String(item.tahun);
    const total = Number(item.total);

    if (result[bulanIndex] && years.includes(Number(item.tahun))) {
      result[bulanIndex][tahun] = total;
    }
  });

  return result;
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