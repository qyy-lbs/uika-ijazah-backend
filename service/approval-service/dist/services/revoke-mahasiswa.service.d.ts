import type { AuthUser } from "../types/auth.type.js";
export declare function revokeMahasiswaForUser(mahasiswaId: number, user: AuthUser, catatan: string): Promise<{
    mahasiswa: {
        mahasiswa_code: string | null;
        nim: string;
        nama_mahasiswa: string | null;
        program_studi: string | undefined;
        fakultas: string | undefined;
        batch_code: string | null;
        nomor_batch_upload: string | null | undefined;
    };
    approval: {
        role: string;
        level: number;
        status: "revoked";
        catatan: string;
        validated_by: number;
        validated_at: Date | null;
    };
}>;
//# sourceMappingURL=revoke-mahasiswa.service.d.ts.map