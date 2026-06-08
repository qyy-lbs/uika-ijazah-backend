import prisma from "../prisma/prisma.js";

export const getBatchDashboardRepository = async () => {
  return await prisma.$queryRawUnsafe(`
    SELECT
        b.id_batch_upload,
        b.nomor_batch_upload,
        b.tahun_lulus,
        b.periode,

        COUNT(DISTINCT m.id_mahasiswa) AS total_mahasiswa,

        COUNT(
            CASE
                WHEN m.id_mahasiswa IS NOT NULL
                AND v.status_validasi IS NULL
                THEN 1
            END
        ) AS proses,

        COUNT(
            CASE
                WHEN v.status_validasi = 'rejected'
                THEN 1
            END
        ) AS rejected,

        COUNT(
            CASE
                WHEN v.status_validasi = 'revoked'
                THEN 1
            END
        ) AS revoked,

        COUNT(
            CASE
                WHEN v.status_validasi = 'approved'
                THEN 1
            END
        ) AS terbit

    FROM batch_upload b

    LEFT JOIN mahasiswa m
        ON m.id_batch_upload = b.id_batch_upload

    LEFT JOIN (
        SELECT DISTINCT ON (id_mahasiswa)
            id_mahasiswa,
            status_validasi,
            created_at
        FROM validasi
        ORDER BY id_mahasiswa, created_at DESC
    ) v
        ON v.id_mahasiswa = m.id_mahasiswa

    GROUP BY
        b.id_batch_upload,
        b.nomor_batch_upload,
        b.tahun_lulus,
        b.periode

    ORDER BY b.id_batch_upload DESC;
  `);
};

export const getDetailBatchRepository = async (id_batch_upload: number) => {
  return await prisma.$queryRawUnsafe(`
    SELECT
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode,

      m.id_mahasiswa,
      m.nama_mahasiswa AS nama,
      m.nim,

      p.nama_prodi AS prodi,
      p.nama_prodi AS program_studi,

      u.nama_unit AS fakultas,

      COALESCE(v.status_validasi, 'proses') AS status

    FROM batch_upload b

    LEFT JOIN mahasiswa m
      ON m.id_batch_upload = b.id_batch_upload

    LEFT JOIN prodi p
      ON p.id_prodi = m.id_prodi

    LEFT JOIN unit u
      ON u.id_unit = p.id_unit

    LEFT JOIN (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        status_validasi,
        created_at
      FROM validasi
      ORDER BY id_mahasiswa, created_at DESC
    ) v
      ON v.id_mahasiswa = m.id_mahasiswa

    WHERE b.id_batch_upload = ${id_batch_upload}
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