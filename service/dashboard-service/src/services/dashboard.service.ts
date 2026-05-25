import {
  getLatestValidationRepository,
} from "../repositories/dashboard.repository.js";

import {
  mapDashboardStatus,
} from "../helpers/dashboard.helper.js";

export const getSummaryService =
  async () => {

    const validations =
      await getLatestValidationRepository(
        1,
        999999,
        ""
      ) as any;

    const rows = validations.data;

    const summary = {

      total_mahasiswa:
        rows.length,

      proses: 0,

      rejected: 0,

      revoked: 0,

      terbit: 0,
    };

    for (const item of rows) {

      if (item.status === "approved") {
        summary.terbit++;
      }

      else if (
        item.status === "rejected"
      ) {
        summary.rejected++;
      }

      else if (
        item.status === "revoked"
      ) {
        summary.revoked++;
      }

      else {
        summary.proses++;
      }
    }

    return summary;
};


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
        (item: any) => ({

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

          status:
            item.status,

          batch:
            item.nomor_batch_upload,
        })
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