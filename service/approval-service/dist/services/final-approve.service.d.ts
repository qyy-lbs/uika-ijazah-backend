type ApprovedMahasiswa = {
    nim: string;
    nama_mahasiswa: string | null;
};
type GenerateDocumentResult = {
    nim: string;
    nama_mahasiswa: string | null;
    success: boolean;
    data?: unknown;
    error?: string;
};
export declare function triggerFinalApprovalProcess(data: {
    batchId: number;
    approvedMahasiswa: ApprovedMahasiswa[];
}): Promise<{
    triggered: boolean;
    batch_id: number;
    total_mahasiswa: number;
    success_count: number;
    failed_count: number;
    next_process: string[];
    generated_documents: GenerateDocumentResult[];
}>;
export {};
//# sourceMappingURL=final-approve.service.d.ts.map