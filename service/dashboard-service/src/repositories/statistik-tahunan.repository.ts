import prisma from "../prisma/prisma.js";

export const getStatistikTahunanRepository =
  async () => {
    return await prisma.$queryRawUnsafe(`
      SELECT
        EXTRACT(MONTH FROM d.tanggal_terbit) AS bulan,
        EXTRACT(YEAR FROM d.tanggal_terbit) AS tahun,
        COUNT(DISTINCT d.id_mahasiswa) AS total

      FROM dokumen d

      INNER JOIN blockchain bc
        ON bc.id_dokumen = d.id_dokumen

      WHERE d.jenis_dokumen = 'ijazah'
        AND d.tanggal_terbit IS NOT NULL
        AND bc.hash_dokumen IS NOT NULL
        AND bc.hash_block IS NOT NULL

      GROUP BY
        bulan,
        tahun

      ORDER BY
        tahun,
        bulan
    `);
  };