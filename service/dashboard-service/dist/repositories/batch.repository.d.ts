export declare const getBatchDashboardRepository: () => Promise<unknown>;
export declare const getDetailBatchRepository: (id_batch_upload: number) => Promise<unknown>;
export declare const getBatchRepository: (page: number, limit: number, tahun_lulus?: string, periode?: string, search?: string, status?: string) => Promise<{
    data: unknown;
    total: unknown;
}>;
//# sourceMappingURL=batch.repository.d.ts.map