export declare const getBatchDashboardService: () => Promise<{
    batch_code: any;
    nomor_batch_upload: any;
    tahun_lulus: any;
    periode: any;
    total_mahasiswa: number;
    proses: number;
    rejected: number;
    revoked: number;
    terbit: number;
}[]>;
export declare const getDetailBatchService: (id: number, status?: string) => Promise<{
    batch_code: any;
    id_batch_upload: any;
    nomor_batch_upload: any;
    tahun_lulus: any;
    periode: any;
    fakultas: any;
    total_mahasiswa: number;
    mahasiswa: {
        mahasiswa_code: any;
        id_mahasiswa: any;
        nama: any;
        nama_mahasiswa: any;
        nim: any;
        prodi: any;
        program_studi: any;
        fakultas: any;
        tahun_lulus: any;
        tahun: any;
        status: import("../helpers/dashboard.helper.js").DashboardStatus;
        status_asli: any;
        has_verified_document: boolean;
    }[];
} | null>;
export declare const getBatchService: (page: number, limit: number, tahun_lulus?: string, periode?: string, search?: string, status?: string) => Promise<{
    data: {
        batch_code: string | null;
        nomor_batch_upload: string;
        tahun_lulus: number;
        periode: string;
        fakultas: string;
        total_mahasiswa: number;
    }[];
    pagination: {
        page: number;
        limit: number;
        total_data: number;
        total_page: number;
    };
}>;
//# sourceMappingURL=batch.service.d.ts.map