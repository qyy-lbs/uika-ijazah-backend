import type { AuthUser } from "../types/auth.type.js";
export declare function getPendingBatchesForUser(user: AuthUser): Promise<({
    batch_code: string | null;
    nomor_batch_upload: string | null;
    nama_file: string | null;
    periode: import("@prisma/client").$Enums.periode_enum | null;
    tahun_lulus: number | null;
    total_record: number | null;
    created_at: Date | null;
    approval_level: number;
    pending_count: number;
    fakultas: (string | undefined)[];
    mahasiswa: {
        id_mahasiswa: number;
        nim: string;
        nama_mahasiswa: string | null;
        program_studi: string | undefined;
        fakultas: string | undefined;
        tahun_lulus: number | null;
    }[];
} | null)[]>;
//# sourceMappingURL=pending-batch.service.d.ts.map