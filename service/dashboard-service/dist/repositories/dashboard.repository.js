import prisma from "../prisma/prisma.js";
export const getLatestValidationRepository = async (page, limit, search) => {
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
      validated_at,
      created_at,
      updated_at
    FROM validasi
    ORDER BY
      id_mahasiswa,
      COALESCE(validated_at, updated_at, created_at) DESC
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
  )

  SELECT
  m.id_mahasiswa,
  m.uuid AS mahasiswa_uuid,
  m.nama_mahasiswa AS nama,
  m.nim,

  u.nama_unit AS fakultas,
  p.nama_prodi AS prodi,

  COALESCE(m.tahun_lulus, b.tahun_lulus) AS tahun_lulus,

  b.id_batch_upload,
  b.uuid AS batch_uuid,
  b.nomor_batch_upload,
  b.nomor_batch_upload AS batch,
  b.periode::text AS periode,
    COALESCE(v.status_validasi, 'proses') AS status,
    v.validated_by,

    CASE
      WHEN d.id_mahasiswa IS NOT NULL
      THEN true
      ELSE false
    END AS has_verified_document,

    CASE
      WHEN d.tanggal_terbit IS NOT NULL
        THEN d.tanggal_terbit::timestamp

      WHEN COALESCE(v.validated_at, v.updated_at, v.created_at) IS NOT NULL
        THEN COALESCE(v.validated_at, v.updated_at, v.created_at)

      WHEN b.created_at IS NOT NULL
        THEN b.created_at

      ELSE m.created_at
    END AS tanggal_proses

  FROM mahasiswa m

  LEFT JOIN prodi p
    ON p.id_prodi = m.id_prodi

  LEFT JOIN unit u
    ON u.id_unit = p.id_unit

  LEFT JOIN batch_upload b
    ON b.id_batch_upload = m.id_batch_upload

  LEFT JOIN latest_validasi v
    ON v.id_mahasiswa = m.id_mahasiswa

  LEFT JOIN latest_ijazah d
    ON d.id_mahasiswa = m.id_mahasiswa

  ${whereQuery}

  ORDER BY
    tanggal_proses DESC NULLS LAST,
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
    const total = await prisma.$queryRawUnsafe(countQuery);
    return {
        data,
        total: Number(total[0]?.total || 0),
    };
};
//# sourceMappingURL=dashboard.repository.js.map