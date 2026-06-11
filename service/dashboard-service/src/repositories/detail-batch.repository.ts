import prisma from "../prisma/prisma.js";

export const getDetailBatchRepository = async (
  id_batch_upload: number,
  status?: string,
) => {
  const safeStatus = status?.replace(/'/g, "''").toLowerCase().trim();
  let whereStatus = "";

  if (safeStatus) {
    if (safeStatus === "proses") {
      whereStatus = `
        AND v.status_validasi IS NULL
      `;
    } else {
      whereStatus = `
        AND LOWER(v.status_validasi) = '${safeStatus}'
      `;
    }
  }

  return await prisma.$queryRawUnsafe(`
    SELECT
      b.id_batch_upload,
      b.uuid AS batch_uuid,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode,

      m.id_mahasiswa,
      m.uuid AS mahasiswa_uuid,
      m.nama_mahasiswa AS nama,
      m.nim,

      v.status_validasi

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
    ${whereStatus}

    ORDER BY m.nama_mahasiswa ASC
  `);
};
