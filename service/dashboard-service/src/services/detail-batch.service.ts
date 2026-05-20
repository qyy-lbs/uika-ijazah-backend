import { getDetailBatchRepository } from "../repositories/detail-batch.repository.js";

export const getDetailBatchService = async (
  id_batch_upload: number,
  status?: string
) => {

  const rows: any = await getDetailBatchRepository(id_batch_upload, status);

  if (rows.length == 0) {
    return null;
  }



 return {
    id_batch_upload: rows[0].id_batch_upload,
    nomor_batch_upload: rows[0].nomor_batch_upload,
    tahun_lulus: rows[0].tahun_lulus,
    periode: rows[0].periode,   

    mahasiswa: rows.map((item:any) => ({
      id_mahasiswa: item.id_mahasiswa,
      nama: item.nama,
      nim: item.nim,
      status: item.status_validasi || "proses",
    })),
  };
};
  