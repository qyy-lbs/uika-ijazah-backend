import prisma from "../prisma/prisma.js";

export async function findMatkulByProdiId(id_prodi: number) {
  return prisma.akademik.findMany({
    where: {
      id_prodi,
    },
    orderBy: {
      id_akademik: "asc",
    },
  });
}