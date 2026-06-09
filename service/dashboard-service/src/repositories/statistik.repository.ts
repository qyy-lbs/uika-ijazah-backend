import prisma from "../prisma/prisma.js";

export const getStatistikTahunanRepository = async () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;

  return await prisma.$queryRawUnsafe(`
    SELECT
      EXTRACT(MONTH FROM d.tanggal_terbit)::INT AS bulan,
      EXTRACT(YEAR FROM d.tanggal_terbit)::INT AS tahun,
      COUNT(DISTINCT d.id_mahasiswa)::INT AS total
    FROM dokumen d
    WHERE LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
      AND d.tanggal_terbit IS NOT NULL
      AND d.is_verified = true
      AND EXTRACT(YEAR FROM d.tanggal_terbit)::INT BETWEEN ${startYear} AND ${currentYear}
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
      AND EXTRACT(YEAR FROM tanggal_status)::INT = ${year}
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
    ),

    latest_ijazah AS (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        tanggal_terbit,
        is_verified
      FROM dokumen
      WHERE LOWER(TRIM(jenis_dokumen::text)) = 'ijazah'
        AND is_verified = true
        AND tanggal_terbit IS NOT NULL
      ORDER BY
        id_mahasiswa,
        tanggal_terbit DESC
    ),

    base AS (
      SELECT
        m.id_mahasiswa,

        COALESCE(v.status_validasi, 'proses') AS status_validasi,

        CASE
          WHEN i.id_mahasiswa IS NOT NULL
          THEN true
          ELSE false
        END AS has_verified_document,

        CASE
          WHEN LOWER(COALESCE(v.status_validasi::text, '')) IN ('rejected', 'reject', 'ditolak')
            THEN v.created_at

          WHEN LOWER(COALESCE(v.status_validasi::text, '')) IN ('revoked', 'revoke', 'dicabut')
            THEN v.created_at

          WHEN i.id_mahasiswa IS NOT NULL
            THEN i.tanggal_terbit

          ELSE COALESCE(v.created_at, b.created_at)
        END AS tanggal_status

      FROM mahasiswa m

      LEFT JOIN batch_upload b
        ON b.id_batch_upload = m.id_batch_upload

      LEFT JOIN latest_validasi v
        ON v.id_mahasiswa = m.id_mahasiswa

      LEFT JOIN latest_ijazah i
        ON i.id_mahasiswa = m.id_mahasiswa
    )

    SELECT
      id_mahasiswa,
      status_validasi,
      has_verified_document,
      tanggal_status,
      EXTRACT(YEAR FROM tanggal_status)::INT AS tahun_status
    FROM base
    WHERE tanggal_status IS NOT NULL
    ${yearCondition}
  `);
};