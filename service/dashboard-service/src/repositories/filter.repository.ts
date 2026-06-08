import prisma from "../prisma/prisma.js";

export const getFacultiesRepository = async () => {
  return await prisma.$queryRawUnsafe(`
    SELECT DISTINCT
      u.id_unit,
      u.nama_unit AS fakultas

    FROM unit u

    INNER JOIN prodi p
      ON p.id_unit = u.id_unit

    INNER JOIN mahasiswa m
      ON m.id_prodi = p.id_prodi

    WHERE u.nama_unit IS NOT NULL

    ORDER BY
      u.nama_unit ASC
  `);
};

export const getYearsRepository = async () => {
  return await prisma.$queryRawUnsafe(`
    SELECT DISTINCT
      COALESCE(m.tahun_lulus, b.tahun_lulus) AS tahun_lulus

    FROM mahasiswa m

    LEFT JOIN batch_upload b
      ON b.id_batch_upload = m.id_batch_upload

    WHERE COALESCE(m.tahun_lulus, b.tahun_lulus) IS NOT NULL

    ORDER BY
      tahun_lulus DESC
  `);
};