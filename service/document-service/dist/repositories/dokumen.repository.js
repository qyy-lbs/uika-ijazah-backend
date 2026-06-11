import prisma from "../prisma/prisma.js";
export async function findDokumenByMahasiswaAndJenis(id_mahasiswa, jenis_dokumen) {
    return prisma.dokumen.findFirst({
        where: {
            id_mahasiswa,
            jenis_dokumen,
        },
        orderBy: {
            created_at: "desc",
        },
    });
}
export async function createDokumen(data) {
    return prisma.dokumen.create({
        data: {
            id_mahasiswa: data.id_mahasiswa,
            id_template: data.id_template,
            jenis_dokumen: data.jenis_dokumen,
            nomor_dokumen: data.nomor_dokumen ?? null,
            tanggal_terbit: data.tanggal_terbit ?? new Date(),
            file_pdf: data.file_pdf ?? null,
            file_pdf_final: data.file_pdf_final ?? null,
            kode_qr: data.kode_qr ?? null,
            url_akses: data.url_akses ?? null,
            is_verified: data.is_verified ?? false,
        },
    });
}
export async function updateDokumen(id_dokumen, data) {
    return prisma.dokumen.update({
        where: {
            id_dokumen,
        },
        data: {
            id_template: data.id_template,
            nomor_dokumen: data.nomor_dokumen,
            tanggal_terbit: data.tanggal_terbit,
            file_pdf: data.file_pdf,
            file_pdf_final: data.file_pdf_final,
            kode_qr: data.kode_qr,
            url_akses: data.url_akses,
            is_verified: data.is_verified,
            updated_at: new Date(),
        },
    });
}
export async function upsertDokumenByMahasiswaAndJenis(data) {
    const existing = await findDokumenByMahasiswaAndJenis(data.id_mahasiswa, data.jenis_dokumen);
    if (existing) {
        return updateDokumen(existing.id_dokumen, data);
    }
    return createDokumen(data);
}
export async function findDokumenByNim(nim) {
    return prisma.dokumen.findMany({
        where: {
            mahasiswa: {
                nim,
            },
        },
        include: {
            mahasiswa: {
                select: {
                    id_mahasiswa: true,
                    nim: true,
                    nama_mahasiswa: true,
                },
            },
            template: {
                select: {
                    id_template: true,
                    jenis_template: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });
}
export async function findDokumenById(id_dokumen) {
    return prisma.dokumen.findUnique({
        where: {
            id_dokumen,
        },
        include: {
            mahasiswa: {
                select: {
                    id_mahasiswa: true,
                    nim: true,
                    nama_mahasiswa: true,
                },
            },
            template: {
                select: {
                    id_template: true,
                    jenis_template: true,
                },
            },
        },
    });
}
export async function findDokumenByKodeQr(kode_qr) {
    return prisma.dokumen.findFirst({
        where: {
            kode_qr,
        },
        include: {
            mahasiswa: {
                select: {
                    id_mahasiswa: true,
                    nim: true,
                    nama_mahasiswa: true,
                    nik: true,
                    tempat_lahir: true,
                    tanggal_lahir: true,
                    jenis_kelamin: true,
                    foto: true,
                    prodi: {
                        include: {
                            unit: true,
                        },
                    },
                },
            },
            template: {
                select: {
                    id_template: true,
                    jenis_template: true,
                },
            },
        },
    });
}
//# sourceMappingURL=dokumen.repository.js.map