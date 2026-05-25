import prisma from "../prisma/prisma.js";

export const getStatistikTahunanRepository =
  async () => {

    return await prisma.$queryRawUnsafe(`
      SELECT
        EXTRACT(MONTH FROM d.tanggal_terbit) AS bulan,
        EXTRACT(YEAR FROM d.tanggal_terbit) AS tahun,
        COUNT(*) AS total

      FROM dokumen d

      WHERE d.jenis_dokumen = 'ijazah'
      AND d.tanggal_terbit IS NOT NULL

      GROUP BY
        bulan,
        tahun

      ORDER BY
        tahun,
        bulan
    `);
};