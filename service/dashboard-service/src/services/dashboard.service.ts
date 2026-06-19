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
  mahasiswa_code: item.mahasiswa_uuid ?? null,

  nama: item.nama,
  nim: item.nim,

  fakultas: item.fakultas || "-",
  prodi: item.prodi || "-",

  tahun_lulus: item.tahun_lulus,

  batch_code: item.batch_uuid ?? null,
  nomor_batch_upload: item.nomor_batch_upload || "-",
  batch: item.batch || item.nomor_batch_upload || "-",
  periode: item.periode || "-",

  status,
  status_asli: item.status,

  has_verified_document: Boolean(item.has_verified_document),
  tanggal_proses: item.tanggal_proses,
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

    // Tambahan data minggu ini
    terbitMingguIni: 0,
    prosesMingguIni: 0,
    rejectMingguIni: 0,
    revokeMingguIni: 0,
  };

  // Awal minggu dihitung dari hari Senin jam 00:00
  const now = new Date();

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // Minggu = 0, Senin = 1
  const diffToMonday = day === 0 ? 6 : day - 1;

  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const isThisWeek = (dateValue: any) => {
    if (!dateValue) return false;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return false;

    return date >= startOfWeek && date <= now;
  };

  rows.forEach((item) => {
    const status = mapDashboardStatus({
      statusValidasi: item.status,
      hasVerifiedDocument: Boolean(item.has_verified_document),
    });

    const tanggalAktivitas = item.tanggal_proses;

    if (status === "terbit") {
      summary.totalIjazahTerbit++;

      if (isThisWeek(tanggalAktivitas)) {
        summary.terbitMingguIni++;
      }
    } 
    
    else if (status === "rejected") {
      summary.dataReject++;

      if (isThisWeek(tanggalAktivitas)) {
        summary.rejectMingguIni++;
      }
    } 
    
    else if (status === "revoked") {
      summary.dataRevoke++;

      if (isThisWeek(tanggalAktivitas)) {
        summary.revokeMingguIni++;
      }
    } 
    
    else {
      summary.permintaanVerifikasi++;

      if (isThisWeek(tanggalAktivitas)) {
        summary.prosesMingguIni++;
      }
    }
  });

  return summary;
};