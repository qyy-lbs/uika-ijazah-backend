import { generateDocumentByNim } from "../clients/document.client.js";
export async function triggerFinalApprovalProcess(data) {
    const generatedDocuments = [];
    /**
     * Jangan pakai Promise.all dulu.
     * Generate dokumen memakai Puppeteer, jadi lebih aman sequential
     * agar server tidak membuka banyak Chromium sekaligus.
     */
    for (const mahasiswa of data.approvedMahasiswa) {
        try {
            const result = await generateDocumentByNim(mahasiswa.nim);
            generatedDocuments.push({
                nim: mahasiswa.nim,
                nama_mahasiswa: mahasiswa.nama_mahasiswa,
                success: true,
                data: result,
            });
        }
        catch (error) {
            generatedDocuments.push({
                nim: mahasiswa.nim,
                nama_mahasiswa: mahasiswa.nama_mahasiswa,
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Gagal generate dokumen",
            });
        }
    }
    const successCount = generatedDocuments.filter((item) => item.success).length;
    const failedCount = generatedDocuments.filter((item) => !item.success).length;
    return {
        triggered: true,
        batch_id: data.batchId,
        total_mahasiswa: data.approvedMahasiswa.length,
        success_count: successCount,
        failed_count: failedCount,
        next_process: [
            "generate_ijazah",
            "generate_transkrip",
            "generate_qr",
            "verify_qr",
        ],
        generated_documents: generatedDocuments,
    };
}
//# sourceMappingURL=final-approve.service.js.map