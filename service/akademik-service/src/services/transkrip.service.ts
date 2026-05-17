import { findMahasiswaByNim } from "../repositories/mahasiswa.repository.js";
import { findNilaiByMahasiswaId } from "../repositories/transkrip.repository.js";
import { hitungPredikat } from "../utils/predikat.util.js";
import { generateNilaiDummyIfNeeded } from "./generate-nilai-dummy.service.js";

export async function getTranskripByNim(nim: string) {
  const mahasiswa = await findMahasiswaByNim(nim);

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }
  await generateNilaiDummyIfNeeded({
    id_mahasiswa: mahasiswa.id_mahasiswa,
    id_prodi: mahasiswa.id_prodi,
  });
  const nilaiList = await findNilaiByMahasiswaId(mahasiswa.id_mahasiswa);

  const mataKuliah = nilaiList.map((item: any, index: number) => {
    const am = item.nilai_angka ? Number(item.nilai_angka) : 0;
    const k = item.akademik?.bobot_k || 0;
    const t = item.bobot_t ? Number(item.bobot_t) : am * k;

    return {
      no: index + 1,
      kode: item.akademik?.kode_matkul,
      nama: item.akademik?.nama_matkul,
      hm: item.nilai_huruf,
      am,
      k,
      t,
    };
  });

  const totalSks = mataKuliah.reduce(
    (total: number, item: any) => total + item.k,
    0,
  );
  const totalBobot = mataKuliah.reduce(
    (total: number, item: any) => total + item.t,
    0,
  );

  const ipkHitung =
    totalSks > 0 ? Number((totalBobot / totalSks).toFixed(2)) : 0;

  const ipkFinal = mahasiswa.ipk ? Number(mahasiswa.ipk) : ipkHitung;

  const predikatFinal = mahasiswa.predikat
    ? mahasiswa.predikat
    : hitungPredikat(ipkFinal);

  return {
    nim: mahasiswa.nim,
    nama_mahasiswa: mahasiswa.nama_mahasiswa,
    fakultas: mahasiswa.prodi?.unit?.nama_unit,
    program_studi: mahasiswa.prodi?.nama_prodi,
    tahun_masuk: mahasiswa.tahun_masuk,
    tahun_lulus: mahasiswa.tahun_lulus,
    ipk: ipkFinal,
    total_sks: totalSks,
    total_bobot: totalBobot,
    predikat: predikatFinal,
    mata_kuliah: mataKuliah,
  };
}
