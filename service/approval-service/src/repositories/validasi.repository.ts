import prisma from "../prisma/prisma.js";

export async function findValidasiByMahasiswaAndLevel(
  id_mahasiswa: number,
  level_validasi: number
) {
  return prisma.validasi.findFirst({
    where: {
      id_mahasiswa,
      level_validasi,
    },
  });
}

export async function createValidasi(data: {
  id_mahasiswa: number;
  validated_by: number;
  level_validasi: number;
  status_validasi: string;
  catatan: string | null;
}) {
  return prisma.validasi.create({
    data: {
      id_mahasiswa: data.id_mahasiswa,
      validated_by: data.validated_by,
      level_validasi: data.level_validasi,
      status_validasi: data.status_validasi,
      catatan: data.catatan,
      validated_at: new Date(),
    },
  });
}

export async function updateValidasi(
  id_validasi: number,
  data: {
    validated_by: number;
    status_validasi: string;
    catatan: string | null;
  }
) {
  return prisma.validasi.update({
    where: {
      id_validasi,
    },
    data: {
      validated_by: data.validated_by,
      status_validasi: data.status_validasi,
      catatan: data.catatan,
      validated_at: new Date(),
      updated_at: new Date(),
    },
  });
}