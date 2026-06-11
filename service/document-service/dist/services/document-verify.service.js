import { findDokumenByKodeQr } from "../repositories/dokumen.repository.js";
function buildPdfUrl(filePath) {
    if (!filePath)
        return null;
    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3009";
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
    }
    if (filePath.startsWith("/")) {
        return `${baseUrl}${filePath}`;
    }
    return `${baseUrl}/${filePath}`;
}
export async function verifyDocumentByKodeQr(kodeQr) {
    if (!kodeQr || kodeQr.trim() === "") {
        throw new Error("Kode QR wajib diisi");
    }
    const dokumen = await findDokumenByKodeQr(kodeQr);
    if (!dokumen) {
        return {
            is_valid: false,
            message: "Dokumen tidak ditemukan atau QR tidak valid",
            kode_qr: kodeQr,
        };
    }
    return {
        is_valid: true,
        message: "Dokumen valid",
        kode_qr: dokumen.kode_qr,
        jenis_dokumen: dokumen.jenis_dokumen,
        nomor_dokumen: dokumen.nomor_dokumen,
        tanggal_terbit: dokumen.tanggal_terbit,
        is_verified: dokumen.is_verified,
        url_akses: dokumen.url_akses,
        file_pdf: dokumen.file_pdf,
        file_pdf_final: dokumen.file_pdf_final,
        file_pdf_url: buildPdfUrl(dokumen.file_pdf_final || dokumen.file_pdf),
        mahasiswa: {
            id_mahasiswa: dokumen.mahasiswa?.id_mahasiswa,
            nim: dokumen.mahasiswa?.nim,
            nama_mahasiswa: dokumen.mahasiswa?.nama_mahasiswa,
            nik: dokumen.mahasiswa?.nik,
            tempat_lahir: dokumen.mahasiswa?.tempat_lahir,
            tanggal_lahir: dokumen.mahasiswa?.tanggal_lahir,
            jenis_kelamin: dokumen.mahasiswa?.jenis_kelamin,
            foto: dokumen.mahasiswa?.foto,
            fakultas: dokumen.mahasiswa?.prodi?.unit?.nama_unit ?? null,
            program_studi: dokumen.mahasiswa?.prodi?.nama_prodi ?? null,
        },
        template: dokumen.template,
    };
}
//# sourceMappingURL=document-verify.service.js.map