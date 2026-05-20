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

    let approved = 0;
    let pending = 0;
    let rejected = 0;

    rows.forEach((item) => {

      if (item.status_validasi === "approved") {
        approved = Number(item.total);
      }

      if (item.status_validasi === "pending") {
        pending = Number(item.total);
      }

      if (item.status_validasi === "rejected") {
        rejected = Number(item.total);
      }

    });

    return {
      approved,
      pending,
      rejected
    };
  };