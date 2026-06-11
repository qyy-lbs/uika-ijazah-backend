import type { AuthUser } from "../types/auth.type.js";
export declare function getBatchDetailForUser(batchId: number, user: AuthUser): Promise<{
    batch: {
        batch_code: string | null;
        uuid: string | null;
        nomor_batch_upload: string | null;
        nama_file: string | null;
        periode: import("@prisma/client").$Enums.periode_enum | null;
        tahun_lulus: number | null;
        total_record: number;
        record_berhasil: number | null;
        record_gagal: number | null;
        created_at: Date | null;
    };
    approval: {
        role: string;
        level: number;
        can_validate_count: number;
    };
    mahasiswa: {
        mahasiswa_code: string | null;
        nim: string;
        nama_mahasiswa: string | null;
        program_studi: string | undefined;
        fakultas: string | undefined;
        tahun_lulus: number | null;
        status_kelulusan: string | null;
        current_approval_level: number;
        current_level_status: string | null;
        can_validate: boolean;
        validasi: {
            validasi_code: string | null;
            level_validasi: number;
            status_validasi: string | null;
            catatan: string | null;
            validated_by: number | null;
            validated_at: Date | null;
        }[];
    }[];
}>;
//# sourceMappingURL=batch-detail.service.d.ts.map