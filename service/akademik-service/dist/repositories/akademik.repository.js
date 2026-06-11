import prisma from "../prisma/prisma.js";
export async function findMatkulByProdiId(id_prodi) {
    return prisma.akademik.findMany({
        where: {
            id_prodi,
        },
        orderBy: {
            id_akademik: "asc",
        },
    });
}
//# sourceMappingURL=akademik.repository.js.map