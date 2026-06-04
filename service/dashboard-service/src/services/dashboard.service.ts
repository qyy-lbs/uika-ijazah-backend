import {
  getLatestValidationRepository,
} from "../repositories/dashboard.repository.js";

import {
  mapDashboardStatus,
} from "../helpers/dashboard.helper.js";

type SummaryDashboard = {
  total_mahasiswa: number;
  proses: number;
  rejected: number;
  revoked: number;
  terbit: number;
};

const getStatusDashboard = (item: any) => {
  return mapDashboardStatus({
    statusValidasi:
      item.status,

    validated_by:
      item.validated_by || null,

    hasDokumen:
      Boolean(item.has_dokumen),

    hasBlockchain:
      Boolean(item.has_blockchain),
  });
};

// ==================== SUMMARY DASHBOARD ====================

export const getSummaryService =
  async () => {

    const validations =
      (await getLatestValidationRepository(
        1,
        999999,
        ""
      )) as any;

    const rows =
      validations.data || [];

    const summary: SummaryDashboard = {
      total_mahasiswa:
        rows.length,

      proses: 0,

      rejected: 0,

      revoked: 0,

      terbit: 0,
    };

    for (const item of rows) {
      const status =
        getStatusDashboard(item);

      if (status === "terbit") {
        summary.terbit++;
      }

      else if (status === "rejected") {
        summary.rejected++;
      }

      else if (status === "revoked") {
        summary.revoked++;
      }

      else {
        summary.proses++;
      }
    }

    return summary;
  };


// ==================== LATEST VALIDATION / TABEL DASHBOARD ====================

export const getLatestValidationService =
  async (
    page: number,
    limit: number,
    search: string
  ) => {

    const result: any =
      await getLatestValidationRepository(
        page,
        limit,
        search
      );

    return {

      data: result.data.map(
        (item: any) => {

          const status =
            getStatusDashboard(item);

          return {
            id_mahasiswa:
              item.id_mahasiswa,

            nama:
              item.nama,

            nim:
              item.nim,

            fakultas:
              item.fakultas,

            prodi:
              item.prodi,

            tahun_lulus:
              item.tahun_lulus,

            status,

            status_asli:
              item.status,

            has_dokumen:
              Boolean(item.has_dokumen),

            has_blockchain:
              Boolean(item.has_blockchain),

            batch:
              item.nomor_batch_upload,
          };
        }
      ),

      pagination: {

        page,

        limit,

        total_data:
          result.total,

        total_page:
          Math.ceil(
            result.total / limit
          ),
      },
    };
  };