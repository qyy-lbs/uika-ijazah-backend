import type { AuthUser } from "../types/auth.type.js";
export declare function getLaporanApprovalForUser(user: AuthUser, query: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
}): Promise<{
    data: {
        mahasiswa_code: string | null;
        batch_code: string | null;
        nama: string | null;
        nim: string;
        program_studi: string | undefined;
        fakultas: string | undefined;
        tanggal: Date | null;
        waktu: Date | null;
        status: "rejected" | "revoked" | "Proses" | "Terbit";
        keterangan: string;
    }[];
    pagination: {
        page: number;
        limit: number;
        total_data: number;
        total_page: number;
    };
}>;
//# sourceMappingURL=laporan.service.d.ts.map