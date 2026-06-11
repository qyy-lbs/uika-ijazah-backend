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

export async function findMahasiswaById(id_mahasiswa: number) {
  return prisma.mahasiswa.findUnique({
    where: {
      id_mahasiswa,
    },
    include: {
      prodi: {
        include: {
          unit: {
            include: {
              unit: true,
            },
          },
        },
      },
      batch_upload: true,
      validasi: {
        orderBy: {
          level_validasi: "asc",
        },
      },
    },
  });
}

export async function findMahasiswaByUuid(mahasiswaCode: string) {
  return prisma.mahasiswa.findUnique({
    where: {
      uuid: mahasiswaCode,
    },
    include: {
      prodi: {
        include: {
          unit: {
            include: {
              unit: true,
            },
          },
        },
      },
      batch_upload: true,
      validasi: {
        orderBy: {
          level_validasi: "asc",
        },
      },
    },
  });
}