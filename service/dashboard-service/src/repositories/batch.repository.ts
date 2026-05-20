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


export const getDetailBatchRepository = async (
  id_batch_upload: number
) => {
  return await prisma.$queryRawUnsafe(`
    SELECT
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode,

      m.id_mahasiswa,
      m.nama_mahasiswa AS nama,
      m.nim,

      COALESCE(v.status_validasi, 'proses') AS status

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

    WHERE b.id_batch_upload = ${id_batch_upload}
  `);
};


export const getBatchRepository = async (
  page: number,
  limit: number,
  tahun_lulus?: string,
  periode?: string,
  search?: string
) => {

  const offset = (page - 1) * limit;

  let whereQuery = `WHERE 1=1`;

  if (tahun_lulus) {
    whereQuery += `
      AND b.tahun_lulus = ${tahun_lulus}
    `;
  }

  if (periode) {
    whereQuery += `
      AND b.periode = '${periode}'
    `;
  }

  if (search) {
    whereQuery += `
      AND b.nomor_batch_upload ILIKE '%${search}%'
    `;
  }

  const data = await prisma.$queryRawUnsafe(`
    SELECT
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode,
      COUNT(m.id_mahasiswa) as total_mahasiswa

    FROM batch_upload b

    LEFT JOIN mahasiswa m
      ON m.id_batch_upload = b.id_batch_upload

    ${whereQuery}

    GROUP BY
      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode

    ORDER BY b.id_batch_upload DESC

    LIMIT ${limit}
    OFFSET ${offset}
  `);

  const total = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total
    FROM batch_upload b
    ${whereQuery}
  `);

  return {
    data,
    total
  };
};