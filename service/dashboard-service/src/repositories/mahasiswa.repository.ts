import prisma from "../prisma/prisma.js";

export const getDetailMahasiswaRepository = async (
  id: number
) => {
  return await prisma.$queryRawUnsafe(`
    SELECT
      m.id_mahasiswa,
      m.nama_mahasiswa AS nama,
      m.nim,
      m.email,
      m.nomor_seri_ijazah,
      m.tempat_lahir,
      m.tanggal_lahir,

      b.id_batch_upload,
      b.nomor_batch_upload,
      b.tahun_lulus,
      b.periode,

      v.status_validasi,

      d.id_dokumen,
      d.jenis_dokumen,
      d.nomor_dokumen,
      d.file_pdf,
      d.file_pdf_final,
      d.is_verified,

      bc.hash_dokumen,
      bc.hash_block,
      bc.previous_hash,
      bc.index_block,

      u.email AS validator

    FROM mahasiswa m

    LEFT JOIN batch_upload b
      ON b.id_batch_upload = m.id_batch_upload

    LEFT JOIN (
      SELECT DISTINCT ON (id_mahasiswa)
        id_mahasiswa,
        status_validasi,
        validated_by,
        created_at
      FROM validasi
      ORDER BY id_mahasiswa, created_at DESC
    ) v
      ON v.id_mahasiswa = m.id_mahasiswa

    LEFT JOIN dokumen d
      ON d.id_mahasiswa = m.id_mahasiswa

    LEFT JOIN blockchain bc
      ON bc.id_dokumen = d.id_dokumen

    LEFT JOIN users u
      ON u.id_user = v.validated_by

    WHERE m.id_mahasiswa = ${id}
  `);
};  