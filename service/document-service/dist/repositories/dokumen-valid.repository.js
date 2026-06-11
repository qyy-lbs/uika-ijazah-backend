import prisma from "../prisma/prisma.js";
export async function findBatchesWithValidDocuments() {
    return prisma.batch_upload.findMany({
        include: {
            mahasiswa: {
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
            id_batch_upload: "desc",
        },
    });
}
export async function findBatchWithValidDocumentsById(batchId) {
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
//# sourceMappingURL=dokumen-valid.repository.js.map