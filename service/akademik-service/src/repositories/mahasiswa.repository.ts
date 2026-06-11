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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function findMahasiswaByUuid(mahasiswaCode: string) {
  const code = mahasiswaCode.trim();

  return prisma.mahasiswa.findFirst({
    where: isUuid(code)
      ? {
          uuid: code,
        }
      : {
          nim: code,
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