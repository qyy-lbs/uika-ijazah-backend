import prisma from "../prisma/prisma.js";

export const getLatestValidationRepository = async (
  page: number,
  limit: number,
  search: string
) => {
  const offset = (page - 1) * limit;
  const safeSearch = (search || "").replace(/'/g, "''");

  const whereQuery = `
    WHERE (
      m.nama_mahasiswa ILIKE '%${safeSearch}%'
      OR m.nim ILIKE '%${safeSearch}%'
      OR p.nama_prodi ILIKE '%${safeSearch}%'
      OR u.nama_unit ILIKE '%${safeSearch}%'
      OR b.nomor_batch_upload ILIKE '%${safeSearch}%'
      OR CAST(COALESCE(m.tahun_lulus, b.tahun_lulus) AS TEXT) ILIKE '%${safeSearch}%'
      OR b.periode::text ILIKE '%${safeSearch}%'
    )
  `;

  const query = `
    WITH latest_validasi AS (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        status_validasi,
        validated_by,
        created_at
      FROM validasi
      ORDER BY
        id_mahasiswa,
        created_at DESC
    )

    SELECT
      m.id_mahasiswa,
      m.nama_mahasiswa AS nama,
      m.nim,

      u.nama_unit AS fakultas,
      p.nama_prodi AS prodi,

      COALESCE(m.tahun_lulus, b.tahun_lulus) AS tahun_lulus,

      b.id_batch_upload,
      b.nomor_batch_upload,
      b.nomor_batch_upload AS batch,
      b.periode::text AS periode,

      COALESCE(v.status_validasi, 'proses') AS status,
      v.validated_by,

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

    LEFT JOIN prodi p
      ON p.id_prodi = m.id_prodi

    LEFT JOIN unit u
      ON u.id_unit = p.id_unit

    LEFT JOIN batch_upload b
      ON b.id_batch_upload = m.id_batch_upload

    LEFT JOIN latest_validasi v
      ON v.id_mahasiswa = m.id_mahasiswa

    ${whereQuery}

    ORDER BY
      m.id_mahasiswa DESC

    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total

    FROM mahasiswa m

    LEFT JOIN prodi p
      ON p.id_prodi = m.id_prodi

    LEFT JOIN unit u
      ON u.id_unit = p.id_unit

    LEFT JOIN batch_upload b
      ON b.id_batch_upload = m.id_batch_upload

    ${whereQuery}
  `;

  const data = await prisma.$queryRawUnsafe(query);
  const total: any = await prisma.$queryRawUnsafe(countQuery);

  return {
    data,
    total: Number(total[0]?.total || 0),
  };
};