export declare function findNilaiByMahasiswaId(id_mahasiswa: number): Promise<({
    akademik: {
        uuid: string | null;
        id_prodi: number | null;
        created_at: Date | null;
        updated_at: Date | null;
        id_akademik: number;
        bobot_t: number | null;
        kode_matkul: string | null;
        nama_matkul: string | null;
        bobot_k: number | null;
    } | null;
} & {
    uuid: string | null;
    id_mahasiswa: number | null;
    created_at: Date | null;
    updated_at: Date | null;
    id_nilai: number;
    id_akademik: number | null;
    nilai_huruf: string | null;
    nilai_angka: import("@prisma/client-runtime-utils").Decimal | null;
    bobot_t: import("@prisma/client-runtime-utils").Decimal | null;
})[]>;
//# sourceMappingURL=transkrip.repository.d.ts.map