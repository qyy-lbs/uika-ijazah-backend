import { findMahasiswaByNim } from "../repositories/mahasiswa.repository.js";
import { getTranskripByNim } from "./transkrip.service.js";

export async function getProfileByNim(nim: string) {
  const mahasiswa = await findMahasiswaByNim(nim);

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  const transkrip = await getTranskripByNim(nim);
  const statusTerakhir = mahasiswa.validasi[0];

  return {
    mahasiswa: {
      id_mahasiswa: mahasiswa.id_mahasiswa,
      nim: mahasiswa.nim,
      nik: mahasiswa.nik,
      nomor_seri_ijazah: mahasiswa.nomor_seri_ijazah,
      pisn: mahasiswa.pisn,
      nama_mahasiswa: mahasiswa.nama_mahasiswa,
      tempat_lahir: mahasiswa.tempat_lahir,
      tanggal_lahir: mahasiswa.tanggal_lahir,
      jenis_kelamin: mahasiswa.jenis_kelamin,
      email: mahasiswa.email,
      telepon: mahasiswa.telepon,
      foto: mahasiswa.foto,
    },

    akademik: {
      fakultas: mahasiswa.prodi?.unit?.nama_unit,
      program_studi: mahasiswa.prodi?.nama_prodi,
      tahun_masuk: mahasiswa.tahun_masuk,
      tahun_lulus: mahasiswa.tahun_lulus,
      tanggal_kelulusan: mahasiswa.tanggal_kelulusan,
      ipk: mahasiswa.ipk ? Number(mahasiswa.ipk) : transkrip.ipk,
      total_sks: transkrip.total_sks,
      total_bobot: transkrip.total_bobot,
      predikat: mahasiswa.predikat,
      judul_skripsi: mahasiswa.judul_skripsi,
      status_kelulusan: mahasiswa.status_kelulusan,
    },

    batch: mahasiswa.batch_upload
      ? {
          id_batch_upload: mahasiswa.batch_upload.id_batch_upload,
          nomor_batch_upload: mahasiswa.batch_upload.nomor_batch_upload,
          nama_file: mahasiswa.batch_upload.nama_file,
          periode: mahasiswa.batch_upload.periode,
          tahun_lulus: mahasiswa.batch_upload.tahun_lulus,
        }
      : null,

    status: statusTerakhir
      ? {
          status_validasi: statusTerakhir.status_validasi,
          level_validasi: statusTerakhir.level_validasi,
          catatan: statusTerakhir.catatan,
          validated_at: statusTerakhir.validated_at,
        }
      : {
          status_validasi: "belum divalidasi",
          level_validasi: 0,
          catatan: null,
          validated_at: null,
        },

    transkrip: transkrip.mata_kuliah,
  };
}