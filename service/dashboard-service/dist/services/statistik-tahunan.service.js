import { getStatistikTahunanRepository } from "../repositories/statistik-tahunan.repository.js";
export const getStatistikTahunanService = async () => {
    const rows = (await getStatistikTahunanRepository());
    const bulanMap = {
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
    const result = {};
    const years = [
        ...new Set(rows.map((item) => String(item.tahun))),
    ];
    Object.entries(bulanMap).forEach(([_, value]) => {
        result[value] = {
            bulan: value,
        };
        years.forEach((year) => {
            result[value][year] = 0;
        });
    });
    rows.forEach((item) => {
        const namaBulan = bulanMap[item.bulan];
        if (!namaBulan) {
            return;
        }
        const tahun = String(item.tahun);
        result[namaBulan][tahun] =
            Number(item.total);
    });
    return Object.values(result);
};
//# sourceMappingURL=statistik-tahunan.service.js.map