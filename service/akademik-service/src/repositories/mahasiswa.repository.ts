import prisma from "../prisma/prisma.js";

export async function findMahasiswaByNim(nim: string) {
  return prisma.mahasiswa.findUnique({
    where: {
      nim,
    },
    include: {
      prodi: {
        include: {
          unit: {
            include: {
              unit: true, // parent unit universitas
            },
          },
        },
      },
      batch_upload: true,
      validasi: {
        orderBy: {
          level_validasi: "desc",
        },
      },
    },
  });
}