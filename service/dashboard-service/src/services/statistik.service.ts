import {
  getStatistikValidasiRepository,
} from "../repositories/statistik.repository.js";

import {
  mapDashboardStatus,
} from "../helpers/dashboard.helper.js";

export const getStatistikValidasiService =
  async (
    year?: number
  ) => {

    const rows =
      (await getStatistikValidasiRepository(
        year
      )) as {
        id_mahasiswa: number;
        status_validasi: string | null;
        validated_by: number | null;
        has_dokumen: boolean;
        has_blockchain: boolean;
      }[];

    const result = {
      terbit: 0,
      proses: 0,
      rejected: 0,
      revoked: 0,
    };

    rows.forEach((item) => {
      const status =
        mapDashboardStatus({
          statusValidasi:
            item.status_validasi,

          validated_by:
            item.validated_by || null,

          hasDokumen:
            Boolean(item.has_dokumen),

          hasBlockchain:
            Boolean(item.has_blockchain),
        });

      if (status === "terbit") {
        result.terbit++;
      }

      else if (status === "rejected") {
        result.rejected++;
      }

      else if (status === "revoked") {
        result.revoked++;
      }

      else {
        result.proses++;
      }
    });

    return result;
  };