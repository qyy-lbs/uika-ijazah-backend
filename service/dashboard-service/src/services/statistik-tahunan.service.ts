import {
  getStatistikTahunanRepository
} from "../repositories/statistik-tahunan.repository.js";

type StatistikTahunan = {
  bulan: number;
  tahun: number;
  total: bigint;
};

type ResultItem = {
  bulan: string;
  [key: string]: string | number;
};

export const getStatistikTahunanService =
  async () => {

    const rows =
      (await getStatistikTahunanRepository())as StatistikTahunan[];

    const bulanMap: Record<number, string> = {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "Mei",
      6: "Jun",
      7: "Jul",
      8: "Agu",
      9: "Sep",
      10: "Okt",
      11: "Nov",
      12: "Des",
    };

    const result: Record<
      string,
      ResultItem
    > = {};

    const years = [
      ...new Set(
        rows.map((item) =>
          String(item.tahun)
        )
      ),
    ];

    Object.entries(bulanMap).forEach(
      ([_, value]) => {

        result[value] = {
          bulan: value,
        };

        years.forEach((year) => {

          (result[value] as any)[year] = 0;
        });
      }
    );

    rows.forEach(
      (item: StatistikTahunan) => {

        const namaBulan =
          bulanMap[item.bulan];

        if (!namaBulan) {
          return;
        }

        const tahun =
          String(item.tahun);

        (result[namaBulan] as any)[tahun] =
          Number(item.total);
      }
    );

    return Object.values(result);
};