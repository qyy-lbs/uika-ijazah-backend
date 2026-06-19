import prisma from "../prisma/prisma.js";

export async function findBatchesWithValidDocuments() {
  return prisma.batch_upload.findMany({
    include: {
      mahasiswa: {
        orderBy: {
          nama_mahasiswa: "asc",
        },
        include: {
          prodi: {
            include: {
              unit: true,
            },
          },
          dokumen: {
            where: {
              is_verified: true,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      nomor_batch_upload: "asc",
    },
  });
}

export async function findBatchWithValidDocumentsByCode(batchCode: string) {
  return prisma.batch_upload.findFirst({
    where: {
      uuid: batchCode,
    },
    include: {
      mahasiswa: {
        orderBy: {
          nama_mahasiswa: "asc",
        },
        include: {
          prodi: {
            include: {
              unit: true,
            },
          },
          dokumen: {
            where: {
              is_verified: true,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        },
      },
    },
  });
}

/**
 * Alias lama. Jangan dipakai untuk URL publik baru.
 */
export async function findBatchWithValidDocumentsById(batchId: number) {
  return prisma.batch_upload.findUnique({
    where: {
      id_batch_upload: batchId,
    },
    include: {
      mahasiswa: {
        orderBy: {
          nama_mahasiswa: "asc",
        },
        include: {
          prodi: {
            include: {
              unit: true,
            },
          },
          dokumen: {
            where: {
              is_verified: true,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        },
      },
    },
  });
}
