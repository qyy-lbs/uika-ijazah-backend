import prisma from "../prisma/prisma.js";

export const getLatestValidationRepository =
  async (
    page: number,
    limit: number,
    search: string
  ) => {

    const offset =
      (page - 1) * limit;

    const safeSearch =
      (search || "").replace(/'/g, "''");

    const query = `
      SELECT
        m.id_mahasiswa,
        m.nama_mahasiswa AS nama,
        m.nim,

        u.nama_unit AS fakultas,

        p.nama_prodi AS prodi,

        m.tahun_lulus,

        COALESCE(
          v.status_validasi,
          'proses'
        ) AS status,

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
        END AS has_blockchain,

        b.nomor_batch_upload

      FROM mahasiswa m

      LEFT JOIN prodi p
        ON p.id_prodi = m.id_prodi

      LEFT JOIN unit u
        ON u.id_unit = p.id_unit

      LEFT JOIN batch_upload b
        ON b.id_batch_upload = m.id_batch_upload

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

      WHERE
        m.nama_mahasiswa ILIKE '%${safeSearch}%'
        OR m.nim ILIKE '%${safeSearch}%'
        OR p.nama_prodi ILIKE '%${safeSearch}%'
        OR u.nama_unit ILIKE '%${safeSearch}%'
        OR b.nomor_batch_upload ILIKE '%${safeSearch}%'

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

      WHERE
        m.nama_mahasiswa ILIKE '%${safeSearch}%'
        OR m.nim ILIKE '%${safeSearch}%'
        OR p.nama_prodi ILIKE '%${safeSearch}%'
        OR u.nama_unit ILIKE '%${safeSearch}%'
        OR b.nomor_batch_upload ILIKE '%${safeSearch}%'
    `;

    const data =
      await prisma.$queryRawUnsafe(query);

    const totalData: any =
      await prisma.$queryRawUnsafe(
        countQuery
      );

    return {
      data,
      total:
        Number(totalData[0].total),
    };
  };