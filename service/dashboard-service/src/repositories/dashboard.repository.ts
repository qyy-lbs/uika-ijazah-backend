import prisma from "../prisma/prisma.js";

export const getLatestValidationsRepository = async () => {
  return await prisma.$queryRaw`
    SELECT
      m.id_mahasiswa,
      m.nama_mahasiswa,
      m.nim,

      v.status_validasi,
      v.level_validasi,
      v.validated_by,

      d.id_dokumen,
      bc.id_blockchain

    FROM mahasiswa m

    LEFT JOIN validasi v
      ON v.id_mahasiswa = m.id_mahasiswa

    LEFT JOIN dokumen d
      ON d.id_mahasiswa = m.id_mahasiswa

    LEFT JOIN blockchain bc
      ON bc.id_dokumen = d.id_dokumen

    ORDER BY v.updated_at DESC
  `;
};