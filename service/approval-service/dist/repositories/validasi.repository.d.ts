export declare function findValidasiByMahasiswaAndLevel(id_mahasiswa: number, level_validasi: number): Promise<{
    uuid: string | null;
    created_at: Date | null;
    level_validasi: number;
    id_validasi: number;
    id_mahasiswa: number | null;
    validated_by: number | null;
    status_validasi: string | null;
    catatan: string | null;
    validated_at: Date | null;
    updated_at: Date | null;
} | null>;
export declare function createValidasi(data: {
    id_mahasiswa: number;
    validated_by: number;
    level_validasi: number;
    status_validasi: string;
    catatan: string | null;
}): Promise<{
    uuid: string | null;
    created_at: Date | null;
    level_validasi: number;
    id_validasi: number;
    id_mahasiswa: number | null;
    validated_by: number | null;
    status_validasi: string | null;
    catatan: string | null;
    validated_at: Date | null;
    updated_at: Date | null;
}>;
export declare function updateValidasi(id_validasi: number, data: {
    validated_by: number;
    status_validasi: string;
    catatan: string | null;
}): Promise<{
    uuid: string | null;
    created_at: Date | null;
    level_validasi: number;
    id_validasi: number;
    id_mahasiswa: number | null;
    validated_by: number | null;
    status_validasi: string | null;
    catatan: string | null;
    validated_at: Date | null;
    updated_at: Date | null;
}>;
//# sourceMappingURL=validasi.repository.d.ts.map