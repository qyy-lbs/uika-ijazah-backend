import {
  getStatistikValidasiRepository
} from "../repositories/statistik.repository.js";

export const getStatistikValidasiService =
  async () => {

    const rows =
      await getStatistikValidasiRepository() as {
        status_validasi: string;
        total: bigint;
      }[];

    let terbit = 0;
    let proses = 0;
    let rejected = 0;
    let revoked = 0;

    rows.forEach((item) => {

      if (item.status_validasi === "approved") {
        terbit = Number(item.total);
      }

      else if (
        item.status_validasi === "rejected"
      ) {
        rejected = Number(item.total);
      }

      else if (
        item.status_validasi === "revoked"
      ) {
        revoked = Number(item.total);
      }

      else {
        proses += Number(item.total);
      }

    });

    return {
      terbit,
      proses,
      rejected,
      revoked
    };
  };  