import prisma from "../prisma/prisma.js";

export async function findNilaiByMahasiswaId(id_mahasiswa: number) {
  return prisma.nilai.findMany({
    where: {
      id_mahasiswa,
    },
    include: {
      akademik: true,
    },
    orderBy: {
      id_nilai: "asc",
    },
  });
}