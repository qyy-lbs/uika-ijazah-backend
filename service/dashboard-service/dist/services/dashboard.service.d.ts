export declare const getLatestValidationService: (page: number, limit: number, search: string) => Promise<{
    data: {
        mahasiswa_code: any;
        nama: any;
        nim: any;
        fakultas: any;
        prodi: any;
        tahun_lulus: any;
        batch_code: any;
        nomor_batch_upload: any;
        batch: any;
        periode: any;
        status: import("../helpers/dashboard.helper.js").DashboardStatus;
        status_asli: any;
        has_verified_document: boolean;
        tanggal_proses: any;
    }[];
    pagination: {
        page: number;
        limit: number;
        total_data: number;
        total_page: number;
    };
}>;
export declare const getDashboardSummaryService: () => Promise<{
    totalIjazahTerbit: number;
    permintaanVerifikasi: number;
    dataReject: number;
    dataRevoke: number;
}>;
//# sourceMappingURL=dashboard.service.d.ts.map