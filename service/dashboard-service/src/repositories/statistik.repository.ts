import prisma from "../prisma/prisma.js";

export const getStatistikValidasiRepository =
  async () => {

    return await prisma.$queryRawUnsafe(`
       SELECT
        status_validasi,
        COUNT(*) as total
      FROM (
        SELECT DISTINCT ON (id_mahasiswa)
          id_mahasiswa,
          status_validasi,
          created_at
        FROM validasi
        ORDER BY id_mahasiswa, created_at DESC
      ) latest_validasi
      GROUP BY status_validasi
    `);
  };