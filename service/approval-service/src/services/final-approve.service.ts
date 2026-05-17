export async function triggerFinalApprovalProcess(data: {
  batchId: number;
  approvedMahasiswa: {
    nim: string;
    nama_mahasiswa: string | null;
  }[];
}) {
  // Placeholder sementara.
  // Nanti bagian ini akan memanggil Document Service.
  // Alur final:
  // 1. Generate ijazah
  // 2. Generate transkrip
  // 3. Generate QR
  // 4. Hash dokumen ke Blockchain Service

  return {
    triggered: true,
    batch_id: data.batchId,
    total_mahasiswa: data.approvedMahasiswa.length,
    next_process: [
      "generate_ijazah",
      "generate_transkrip",
      "generate_qr",
      "hash_blockchain",
    ],
  };
}