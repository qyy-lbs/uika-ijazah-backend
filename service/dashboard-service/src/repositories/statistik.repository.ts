import prisma from "../prisma/prisma.js";

export const getStatistikTahunanRepository = async () => {
  return await prisma.$queryRawUnsafe(`
    SELECT
      EXTRACT(MONTH FROM d.tanggal_terbit)::INT AS bulan,
      EXTRACT(YEAR FROM d.tanggal_terbit)::INT AS tahun,
      COUNT(DISTINCT d.id_mahasiswa)::INT AS total

    FROM dokumen d

    WHERE LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
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

export const getStatistikValidasiRepository = async (
  year?: number
) => {
  const yearCondition = year
    ? `
      AND COALESCE(m.tahun_lulus, b.tahun_lulus) = ${year}
    `
    : "";

  return await prisma.$queryRawUnsafe(`
    WITH latest_validasi AS (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        status_validasi,
        created_at
      FROM validasi
      ORDER BY
        id_mahasiswa,
        created_at DESC
    )

    SELECT
      m.id_mahasiswa,
      COALESCE(v.status_validasi, 'proses') AS status_validasi,

      COALESCE(m.tahun_lulus, b.tahun_lulus) AS tahun_lulus,

      CASE
        WHEN EXISTS (
          SELECT 1
          FROM dokumen d
          WHERE d.id_mahasiswa = m.id_mahasiswa
            AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
            AND d.is_verified = true
        )
        THEN true
        ELSE false
      END AS has_verified_document

    FROM mahasiswa m

    LEFT JOIN batch_upload b
      ON b.id_batch_upload = m.id_batch_upload

    LEFT JOIN latest_validasi v
      ON v.id_mahasiswa = m.id_mahasiswa

    WHERE 1=1
    ${yearCondition}
  `);
};