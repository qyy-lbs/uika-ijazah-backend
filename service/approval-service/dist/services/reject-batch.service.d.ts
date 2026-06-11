import type { AuthUser } from "../types/auth.type.js";
export declare function rejectBatchForUser(batchId: number, user: AuthUser, catatan: string): Promise<{
    batch: {
        id_batch_upload: number;
        nomor_batch_upload: string | null;
        nama_file: string | null;
        tahun_lulus: number | null;
        periode: import("@prisma/client").$Enums.periode_enum | null;
    };
    approval: {
        role: string;
        level: number;
        status: "rejected";
        rejected_count: number;
        catatan: string;
    };
    mahasiswa: {
        id_mahasiswa: number;
        nim: string;
        nama_mahasiswa: string | null;
        program_studi: string | undefined;
        fakultas: string | undefined;
    }[];
}>;
//# sourceMappingURL=reject-batch.service.d.ts.map