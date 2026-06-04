import prisma from "../prisma/prisma.js";

export const getStatistikValidasiRepository =
  async (
    year?: number
  ) => {

    const whereYear =
      year
        ? `WHERE m.tahun_lulus = ${year}`
        : "";

    return await prisma.$queryRawUnsafe(`
      SELECT
        m.id_mahasiswa,

        COALESCE(
          v.status_validasi,
          'proses'
        ) AS status_validasi,

        v.validated_by,

        CASE
          WHEN EXISTS (
            SELECT 1
            FROM dokumen d
            WHERE d.id_mahasiswa = m.id_mahasiswa
              AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
              AND d.tanggal_terbit IS NOT NULL
          )
          THEN true
          ELSE false
        END AS has_dokumen,

        CASE
          WHEN EXISTS (
            SELECT 1
            FROM dokumen d
            INNER JOIN blockchain bc
              ON bc.id_dokumen = d.id_dokumen
            WHERE d.id_mahasiswa = m.id_mahasiswa
              AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
              AND d.tanggal_terbit IS NOT NULL
              AND bc.hash_dokumen IS NOT NULL
              AND bc.hash_block IS NOT NULL
          )
          THEN true
          ELSE false
        END AS has_blockchain

      FROM mahasiswa m

      LEFT JOIN (
        SELECT DISTINCT ON (id_mahasiswa)
          id_mahasiswa,
          status_validasi,
          validated_by,
          created_at
        FROM validasi
        ORDER BY
          id_mahasiswa,
          created_at DESC
      ) v
        ON v.id_mahasiswa = m.id_mahasiswa

      ${whereYear}

      ORDER BY
        m.id_mahasiswa DESC
    `);
  };