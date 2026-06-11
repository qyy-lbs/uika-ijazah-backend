export declare function getValidasiAkademikByMahasiswaId(mahasiswaId: number): Promise<{
    mahasiswa_code: string;
    nim: string;
    nama_mahasiswa: string | null;
    is_valid: boolean;
    checks: {
        data_mahasiswa: boolean;
        prodi: boolean;
        fakultas: boolean;
        ipk: boolean;
        tahun_lulus: boolean;
        tanggal_kelulusan: boolean;
        nomor_seri_ijazah: boolean;
        nilai_transkrip: boolean;
    };
    errors: string[];
}>;
//# sourceMappingURL=validasi-akademik.service.d.ts.map