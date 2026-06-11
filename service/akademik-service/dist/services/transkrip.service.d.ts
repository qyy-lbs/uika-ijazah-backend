export declare function getTranskripByMahasiswaId(mahasiswaId: number): Promise<{
    mahasiswa_code: string;
    nim: string;
    nama_mahasiswa: string | null;
    fakultas: string | undefined;
    program_studi: string | undefined;
    tahun_masuk: number | null;
    tahun_lulus: number | null;
    ipk: number;
    total_sks: number;
    total_bobot: number;
    predikat: string;
    generate_info: {
        generated: boolean;
        total_generated: number;
        message: string;
    };
    mata_kuliah: {
        no: number;
        kode: any;
        nama: any;
        hm: any;
        am: number;
        k: any;
        t: number;
    }[];
}>;
//# sourceMappingURL=transkrip.service.d.ts.map