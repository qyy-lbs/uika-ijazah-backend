import prisma from "../prisma/prisma.js";
export async function findAllBatchesWithMahasiswa() {
    return prisma.batch_upload.findMany({
        include: {
            mahasiswa: {
                include: {
                    prodi: {
                        include: {
                            unit: true,
                        },
                    },
                    validasi: {
                        orderBy: {
                            level_validasi: "asc",
                        },
                    },
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });
}
export async function findBatchByIdWithMahasiswa(batchId) {
    return prisma.batch_upload.findUnique({
        where: {
            id_batch_upload: batchId,
        },
        include: {
            mahasiswa: {
                include: {
                    prodi: {
                        include: {
                            unit: true,
                        },
                    },
                    validasi: {
                        orderBy: {
                            level_validasi: "asc",
                        },
                    },
                },
                orderBy: {
                    nama_mahasiswa: "asc",
                },
            },
        },
    });
}
//# sourceMappingURL=batch.repository.js.map