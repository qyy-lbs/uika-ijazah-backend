import { findMahasiswaById } from "../repositories/mahasiswa.repository.js";
import { findNilaiByMahasiswaId } from "../repositories/transkrip.repository.js";

export async function getValidasiAkademikByMahasiswaId(mahasiswaId: number) {
  const mahasiswa = await findMahasiswaById(mahasiswaId);

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  const nilaiList = await findNilaiByMahasiswaId(mahasiswa.id_mahasiswa);

  const checks = {
    data_mahasiswa: Boolean(mahasiswa.nama_mahasiswa && mahasiswa.nim),
    prodi: Boolean(mahasiswa.prodi),
    fakultas: Boolean(mahasiswa.prodi?.unit),
    ipk: Boolean(mahasiswa.ipk),
    tahun_lulus: Boolean(mahasiswa.tahun_lulus),
    tanggal_kelulusan: Boolean(mahasiswa.tanggal_kelulusan),
    nomor_seri_ijazah: Boolean(mahasiswa.nomor_seri_ijazah),
    nilai_transkrip: nilaiList.length > 0,
  };

  const errors: string[] = [];

  if (!checks.data_mahasiswa) errors.push("Data mahasiswa belum lengkap");
  if (!checks.prodi) errors.push("Program studi belum tersedia");
  if (!checks.fakultas) errors.push("Fakultas belum tersedia");
  if (!checks.ipk) errors.push("IPK belum tersedia");
  if (!checks.tahun_lulus) errors.push("Tahun lulus belum tersedia");
  if (!checks.tanggal_kelulusan) errors.push("Tanggal kelulusan belum tersedia");
  if (!checks.nomor_seri_ijazah) errors.push("Nomor seri ijazah belum tersedia");
  if (!checks.nilai_transkrip) errors.push("Data transkrip nilai belum tersedia");

  const isValid = Object.values(checks).every(Boolean);

  return {
    mahasiswa_code: mahasiswa.uuid,

    nim: mahasiswa.nim,
    nama_mahasiswa: mahasiswa.nama_mahasiswa,
    is_valid: isValid,
    checks,
    errors,
  };
}