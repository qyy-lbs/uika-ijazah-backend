import { getDetailMahasiswaRepository } from "../repositories/mahasiswa.repository.js";

export const getDetailMahasiswaService = async (
  id: number
) => {

  const rows: any = await getDetailMahasiswaRepository(id);

  if (!rows || rows.length === 0) {
    return null;
  }

  const item = rows[0];

  return {
    id_mahasiswa: item.id_mahasiswa,
    nama: item.nama,
    nim: item.nim,

    status: item.status_validasi,

    dokumen: {
      id_dokumen: item.id_dokumen,
      file_ijazah: item.file_ijazah,
      file_transkrip: item.file_transkrip,
    },

    blockchain: {
      id_blockchain: item.id_blockchain,
      hash_blockchain: item.hash_blockchain,
      tx_hash: item.tx_hash,
    },

    validator: {
      nama: item.validator,
    },
  };
};