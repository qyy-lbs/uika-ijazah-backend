import type { AuthUser } from "../types/auth.type.js";
export declare function approveBatchForUser(batchId: number, user: AuthUser): Promise<{
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
        status: "approved";
        approved_count: number;
        is_final_approval: boolean;
        next_action: string;
    };
    final_process: {
        triggered: boolean;
        batch_id: number;
        total_mahasiswa: number;
        success_count: number;
        failed_count: number;
        next_process: string[];
        generated_documents: {
            nim: string;
            nama_mahasiswa: string | null;
            success: boolean;
            data?: unknown;
            error?: string;
        }[];
    } | null;
    mahasiswa: {
        id_mahasiswa: number;
        nim: string;
        nama_mahasiswa: string | null;
        program_studi: string | undefined;
        fakultas: string | undefined;
    }[];
}>;
//# sourceMappingURL=approve-batch.service.d.ts.map