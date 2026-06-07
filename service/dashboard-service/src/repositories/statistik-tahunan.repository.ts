import prisma from "../prisma/prisma.js";

export const getStatistikTahunanRepository = async () => {
  return await prisma.$queryRawUnsafe(`
    SELECT
      EXTRACT(MONTH FROM d.tanggal_terbit)::INT AS bulan,
      EXTRACT(YEAR FROM d.tanggal_terbit)::INT AS tahun,
      COUNT(DISTINCT d.id_mahasiswa)::INT AS total

    FROM dokumen d

    WHERE d.jenis_dokumen = 'ijazah'
      AND d.tanggal_terbit IS NOT NULL
      AND d.is_verified = true

    GROUP BY
      bulan,
      tahun

    ORDER BY
      tahun,
      bulan
  `);
};