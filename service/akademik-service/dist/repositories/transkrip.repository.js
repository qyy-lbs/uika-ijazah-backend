import prisma from "../prisma/prisma.js";
export async function findNilaiByMahasiswaId(id_mahasiswa) {
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
//# sourceMappingURL=transkrip.repository.js.map