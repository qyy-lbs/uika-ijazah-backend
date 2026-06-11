import prisma from "../prisma/prisma.js";

export const getBatchDashboardRepository = async () => {
  return await prisma.$queryRawUnsafe(`
    WITH latest_validasi AS (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        status_validasi,
        created_at
      FROM validasi
      ORDER BY id_mahasiswa, created_at DESC
    ),

    mahasiswa_status AS (
      SELECT
        b.id_batch_upload,
        b.nomor_batch_upload,
        b.tahun_lulus,
        b.periode,

        m.id_mahasiswa,

        COALESCE(v.status_validasi, 'proses') AS status_validasi,

        EXISTS (
          SELECT 1
          FROM dokumen d
          WHERE d.id_mahasiswa = m.id_mahasiswa
            AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
            AND d.is_verified = true
        ) AS has_verified_document

      FROM batch_upload b

      LEFT JOIN mahasiswa m
        ON m.id_batch_upload = b.id_batch_upload

      LEFT JOIN latest_validasi v
        ON v.id_mahasiswa = m.id_mahasiswa
    )

    SELECT
      id_batch_upload,
      nomor_batch_upload,
      tahun_lulus,
      periode,

      COUNT(DISTINCT id_mahasiswa) AS total_mahasiswa,

      COUNT(
        CASE
          WHEN id_mahasiswa IS NOT NULL
            AND LOWER(TRIM(status_validasi)) NOT IN (
              'reject',
              'rejected',
              'ditolak',
              'revoke',
              'revoked',
              'dicabut'
            )
            AND has_verified_document = false
          THEN 1
        END
      ) AS proses,

      COUNT(
        CASE
          WHEN LOWER(TRIM(status_validasi)) IN (
            'reject',
            'rejected',
            'ditolak'
          )
          THEN 1
        END
      ) AS rejected,

      COUNT(
        CASE
          WHEN LOWER(TRIM(status_validasi)) IN (
            'revoke',
            'revoked',
            'dicabut'
          )
          THEN 1
        END
      ) AS revoked,

      COUNT(
        CASE
          WHEN has_verified_document = true
          THEN 1
        END
      ) AS terbit

    FROM mahasiswa_status

    GROUP BY
      id_batch_upload,
      nomor_batch_upload,
      tahun_lulus,
      periode

    ORDER BY id_batch_upload DESC;
  `);
};

export const getDetailBatchRepository = async (id_batch_upload: number) => {
  return await prisma.$queryRawUnsafe(`
    WITH latest_validasi AS (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        status_validasi,
        created_at
      FROM validasi
      ORDER BY id_mahasiswa, created_at DESC
    )

    SELECT
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode::text AS periode,

      m.id_mahasiswa,
      m.nama_mahasiswa AS nama,
      m.nim,

      p.nama_prodi AS prodi,
      p.nama_prodi AS program_studi,

      u.nama_unit AS fakultas,

      COALESCE(v.status_validasi, 'proses') AS status,

      EXISTS (
        SELECT 1
        FROM dokumen d
        WHERE d.id_mahasiswa = m.id_mahasiswa
          AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
          AND d.is_verified = true
      ) AS has_verified_document

    FROM batch_upload b

    LEFT JOIN mahasiswa m
      ON m.id_batch_upload = b.id_batch_upload

    LEFT JOIN prodi p
      ON p.id_prodi = m.id_prodi

    LEFT JOIN unit u
      ON u.id_unit = p.id_unit

    LEFT JOIN latest_validasi v
      ON v.id_mahasiswa = m.id_mahasiswa

    WHERE b.id_batch_upload = ${id_batch_upload}

    ORDER BY m.nama_mahasiswa ASC
  `);
};

export const getBatchRepository = async (
  page: number,
  limit: number,
  tahun_lulus?: string,
  periode?: string,
  search?: string,
  status?: string
) => {
  const offset = (page - 1) * limit;

  const safeTahun = tahun_lulus?.replace(/'/g, "''");
  const safePeriode = periode?.replace(/'/g, "''");
  const safeSearch = search?.replace(/'/g, "''");
  const safeStatus = status?.toLowerCase().trim();

  let whereQuery = `WHERE 1=1`;

  if (safeTahun) {
    whereQuery += `
      AND b.tahun_lulus = ${safeTahun}
    `;
  }

  if (safePeriode) {
    whereQuery += `
      AND b.periode::text ILIKE '%${safePeriode}%'
    `;
  }

  if (safeSearch) {
    whereQuery += `
      AND (
        b.nomor_batch_upload ILIKE '%${safeSearch}%'
        OR COALESCE(u.nama_unit, '') ILIKE '%${safeSearch}%'
        OR CAST(b.tahun_lulus AS TEXT) ILIKE '%${safeSearch}%'
        OR b.periode::text ILIKE '%${safeSearch}%'
        OR COALESCE(m.nama_mahasiswa, '') ILIKE '%${safeSearch}%'
        OR COALESCE(m.nim, '') ILIKE '%${safeSearch}%'
        OR COALESCE(p.nama_prodi, '') ILIKE '%${safeSearch}%'
      )
    `;
  }

  if (safeStatus) {
    if (
      safeStatus === "reject" ||
      safeStatus === "rejected" ||
      safeStatus === "ditolak"
    ) {
      whereQuery += `
        AND LOWER(COALESCE(v.status_validasi, 'proses')) IN (
          'reject',
          'rejected',
          'ditolak'
        )
      `;
    }

    else if (
      safeStatus === "revoke" ||
      safeStatus === "revoked" ||
      safeStatus === "dicabut"
    ) {
      whereQuery += `
        AND LOWER(COALESCE(v.status_validasi, 'proses')) IN (
          'revoke',
          'revoked',
          'dicabut'
        )
      `;
    }

    else if (
      safeStatus === "terbit" ||
      safeStatus === "valid" ||
      safeStatus === "verified"
    ) {
      whereQuery += `
        AND EXISTS (
          SELECT 1
          FROM dokumen d
          WHERE d.id_mahasiswa = m.id_mahasiswa
            AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
            AND d.is_verified = true
        )
      `;
    }

    else if (
      safeStatus === "proses" ||
      safeStatus === "pending"
    ) {
      whereQuery += `
        AND LOWER(COALESCE(v.status_validasi, 'proses')) NOT IN (
          'reject',
          'rejected',
          'ditolak',
          'revoke',
          'revoked',
          'dicabut'
        )

        AND NOT EXISTS (
          SELECT 1
          FROM dokumen d
          WHERE d.id_mahasiswa = m.id_mahasiswa
            AND LOWER(TRIM(d.jenis_dokumen::text)) = 'ijazah'
            AND d.is_verified = true
        )
      `;
    }
  }

  const data = await prisma.$queryRawUnsafe(`
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
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode::text AS periode,

      COALESCE(
        STRING_AGG(DISTINCT u.nama_unit, ', '),
        '-'
      ) AS fakultas,

      COUNT(DISTINCT m.id_mahasiswa) AS total_mahasiswa

    FROM batch_upload b

    LEFT JOIN mahasiswa m
      ON m.id_batch_upload = b.id_batch_upload

    LEFT JOIN prodi p
      ON p.id_prodi = m.id_prodi

    LEFT JOIN unit u
      ON u.id_unit = p.id_unit

    LEFT JOIN latest_validasi v
      ON v.id_mahasiswa = m.id_mahasiswa

    ${whereQuery}

    GROUP BY
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode

    HAVING COUNT(DISTINCT m.id_mahasiswa) > 0

    ORDER BY
      b.id_batch_upload DESC

    LIMIT ${limit}
    OFFSET ${offset}
  `);

  const total = await prisma.$queryRawUnsafe(`
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

    SELECT COUNT(*) AS total
    FROM (
      SELECT
        b.id_batch_upload

      FROM batch_upload b

      LEFT JOIN mahasiswa m
        ON m.id_batch_upload = b.id_batch_upload

      LEFT JOIN prodi p
        ON p.id_prodi = m.id_prodi

      LEFT JOIN unit u
        ON u.id_unit = p.id_unit

      LEFT JOIN latest_validasi v
        ON v.id_mahasiswa = m.id_mahasiswa

      ${whereQuery}

      GROUP BY
        b.id_batch_upload

      HAVING COUNT(DISTINCT m.id_mahasiswa) > 0
    ) AS filtered_batch
  `);

  return {
    data,
    total,
  };
};