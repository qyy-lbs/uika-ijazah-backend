import prisma from "../prisma/prisma.js";
export async function findValidasiByMahasiswaAndLevel(id_mahasiswa, level_validasi) {
    return prisma.validasi.findFirst({
        where: {
            id_mahasiswa,
            level_validasi,
        },
    });
}
export async function createValidasi(data) {
    return prisma.validasi.create({
        data: {
            id_mahasiswa: data.id_mahasiswa,
            validated_by: data.validated_by,
            level_validasi: data.level_validasi,
            status_validasi: data.status_validasi,
            catatan: data.catatan,
            validated_at: new Date(),
        },
    });
}
export async function updateValidasi(id_validasi, data) {
    return prisma.validasi.update({
        where: {
            id_validasi,
        },
        data: {
            validated_by: data.validated_by,
            status_validasi: data.status_validasi,
            catatan: data.catatan,
            validated_at: new Date(),
            updated_at: new Date(),
        },
    });
}
//# sourceMappingURL=validasi.repository.js.map