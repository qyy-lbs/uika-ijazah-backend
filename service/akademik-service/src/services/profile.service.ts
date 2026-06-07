import { findMahasiswaByNim } from "../repositories/mahasiswa.repository.js";
import { getTranskripByNim } from "./transkrip.service.js";

const APPROVAL_LEVEL_LABEL: Record<number, string> = {
  1: "TU Fakultas",
  2: "Wakil Dekan",
  3: "Dekan",
  4: "TU Rektorat",
  5: "Wakil Rektor",
  6: "Rektor",
};

function formatTanggalIndonesia(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTempatTanggalLahir(
  tempat: string | null | undefined,
  tanggal: Date | string | null | undefined,
) {
  const tanggalFormatted = formatTanggalIndonesia(tanggal);

  if (!tempat && !tanggalFormatted) return null;

  return `${tempat || "-"}, ${tanggalFormatted || "-"}`;
}

function getNextValidatorLabel(lastApprovedLevel: number): string {
  const nextLevel = lastApprovedLevel + 1;

  return APPROVAL_LEVEL_LABEL[nextLevel] ?? "Selesai";
}

function getMahasiswaApprovalStatus(
  validasiList: {
    level_validasi: number;
    status_validasi: string | null;
    catatan: string | null;
    validated_at: Date | null;
  }[],
) {
  const rejected = validasiList.find(
    (item) => item.status_validasi?.toLowerCase() === "rejected",
  );

  if (rejected) {
    return {
      status: "Reject",
      keterangan: `Di Reject oleh ${
        APPROVAL_LEVEL_LABEL[rejected.level_validasi]
      }`,
      deskripsi:
        rejected.catatan || "Data ditolak karena tidak sesuai persyaratan.",
      level_validasi: rejected.level_validasi,
      catatan: rejected.catatan,
      validated_at: rejected.validated_at,
    };
  }

  const revoked = validasiList.find(
    (item) => item.status_validasi?.toLowerCase() === "revoked",
  );

  if (revoked) {
    return {
      status: "Revoke",
      keterangan: `Di Revoke oleh ${
        APPROVAL_LEVEL_LABEL[revoked.level_validasi]
      }`,
      deskripsi:
        revoked.catatan || "Mahasiswa dikeluarkan dari proses validasi.",
      level_validasi: revoked.level_validasi,
      catatan: revoked.catatan,
      validated_at: revoked.validated_at,
    };
  }

  const approvedList = validasiList
    .filter((item) => item.status_validasi?.toLowerCase() === "approved")
    .sort((a, b) => a.level_validasi - b.level_validasi);

  const lastApproved = approvedList[approvedList.length - 1];

  if (lastApproved?.level_validasi === 6) {
    return {
      status: "Terbit",
      keterangan: "Di Validasi oleh Rektor",
      deskripsi: "Ijazah telah berhasil diterbitkan dan terverifikasi.",
      level_validasi: 6,
      catatan: null,
      validated_at: lastApproved.validated_at,
    };
  }

  const lastApprovedLevel = lastApproved?.level_validasi ?? 0;
  const nextValidator = getNextValidatorLabel(lastApprovedLevel);

  return {
    status: "Proses",
    keterangan: `Di Proses Validasi oleh ${nextValidator}`,
    deskripsi:
      "Data sedang dalam proses verifikasi. Mohon menunggu hingga proses validasi selesai.",
    level_validasi: lastApprovedLevel,
    catatan: null,
    validated_at: lastApproved?.validated_at ?? null,
  };
}
type ValidasiProfileItem = {
  level_validasi: number;
  status_validasi: string | null;
  catatan: string | null;
  validated_at: Date | null;
};
export async function getProfileByNim(nim: string) {
  const mahasiswa = await findMahasiswaByNim(nim);

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  const transkrip = await getTranskripByNim(nim);

  const fakultasUnit = mahasiswa.prodi?.unit ?? null;
  const universitasUnit = fakultasUnit?.unit ?? null;
  const prodi = mahasiswa.prodi ?? null;

  const approval = getMahasiswaApprovalStatus(
    mahasiswa.validasi.map((v: ValidasiProfileItem) => ({
      level_validasi: v.level_validasi,
      status_validasi: v.status_validasi,
      catatan: v.catatan,
      validated_at: v.validated_at,
    })),
  );

  const tempatTanggalLahir = formatTempatTanggalLahir(
    mahasiswa.tempat_lahir,
    mahasiswa.tanggal_lahir,
  );

  return {
    mahasiswa: {
      id_mahasiswa: mahasiswa.id_mahasiswa,
      uuid: mahasiswa.uuid,

      nim: mahasiswa.nim,
      nomor_pokok_mahasiswa: mahasiswa.nim,

      // Sesuai klarifikasi kamu:
      // NINA memakai nomor_seri_ijazah
      nina: mahasiswa.nomor_seri_ijazah,

      nik: mahasiswa.nik,
      nomor_seri_ijazah: mahasiswa.nomor_seri_ijazah,
      pisn: mahasiswa.pisn,

      nama_mahasiswa: mahasiswa.nama_mahasiswa,
      nama: mahasiswa.nama_mahasiswa,

      tempat_lahir: mahasiswa.tempat_lahir,
      tanggal_lahir: mahasiswa.tanggal_lahir,
      tanggal_lahir_formatted: formatTanggalIndonesia(mahasiswa.tanggal_lahir),
      tempat_tanggal_lahir: tempatTanggalLahir,

      jenis_kelamin: mahasiswa.jenis_kelamin,
      email: mahasiswa.email,
      telepon: mahasiswa.telepon,
      foto: mahasiswa.foto,

      program: mahasiswa.program,
      program_en: mahasiswa.program_en,

      gelar: mahasiswa.gelar,
      gelar_en: mahasiswa.gelar_en,

      judul_skripsi: mahasiswa.judul_skripsi,

      tahun_masuk: mahasiswa.tahun_masuk,
      tahun_lulus: mahasiswa.tahun_lulus,

      status_kelulusan: mahasiswa.status_kelulusan,
      tanggal_kelulusan: mahasiswa.tanggal_kelulusan,
      tanggal_kelulusan_formatted: formatTanggalIndonesia(
        mahasiswa.tanggal_kelulusan,
      ),

      id_batch_upload: mahasiswa.id_batch_upload,
    },

    akademik: {
      fakultas: fakultasUnit?.nama_unit ?? null,
      fakultas_en: fakultasUnit?.nama_unit_en ?? null,

      program_studi: prodi?.nama_prodi ?? null,
      program_studi_en: prodi?.nama_prodi_en ?? null,

      program: mahasiswa.program,
      program_en: mahasiswa.program_en,

      tahun_masuk: mahasiswa.tahun_masuk,
      tahun_lulus: mahasiswa.tahun_lulus,

      tanggal_kelulusan: mahasiswa.tanggal_kelulusan,
      tanggal_kelulusan_formatted: formatTanggalIndonesia(
        mahasiswa.tanggal_kelulusan,
      ),

      nomor_sk_akreditasi: prodi?.no_sk_akreditasi ?? null,

      // AIPT dari parent unit universitas
      akreditasi_aipt: universitasUnit?.akreditasi_aipt ?? null,

      ipk: transkrip.ipk,
      total_sks: transkrip.total_sks,
      total_bobot: transkrip.total_bobot,
      predikat: transkrip.predikat,

      status_kelulusan: mahasiswa.status_kelulusan,
    },
    pejabat: {
      // Rektor dari parent unit universitas
      nama_rektor: universitasUnit?.rektor ?? null,
      nidn_rektor: universitasUnit?.nidn_rektor ?? null,

      nama_wakil_rektor_1: universitasUnit?.wakil_rektor_1 ?? null,
      nidn_wakil_rektor_1: universitasUnit?.nidn_wakil_rektor_1 ?? null,

      nama_tu_rektorat: universitasUnit?.tu_rektorat ?? null,

      // Dekan dari unit fakultas
      nama_dekan: fakultasUnit?.dekan ?? null,
      nidn_dekan: fakultasUnit?.nidn_dekan ?? null,

      nama_wakil_dekan_1: fakultasUnit?.wakil_dekan_1 ?? null,
      nidn_wakil_dekan_1: fakultasUnit?.nidn_wakil_dekan_1 ?? null,

      nama_tu_fakultas: fakultasUnit?.tu_fakultas ?? null,

      nama_kaprodi: prodi?.kaprodi ?? null,
      nidn_kaprodi: prodi?.nidn_kaprodi ?? null,
    },
    assets: {
      // Asset rektor dari parent unit universitas
      ttd_rektor: universitasUnit?.file_ttd_rektor ?? null,
      paraf_warek: universitasUnit?.file_paraf_warek ?? null,
      paraf_katu_rektor: universitasUnit?.file_paraf_tu_rektorat ?? null,
      stempel_rektor: universitasUnit?.file_stempel_universitas ?? null,

      // Asset dekan/fakultas dari unit fakultas
      ttd_dekan: fakultasUnit?.file_ttd_dekan ?? null,
      paraf_wadek: fakultasUnit?.file_paraf_wadek ?? null,
      paraf_katu_fakultas: fakultasUnit?.file_paraf_tu_fakultas ?? null,
      stempel_dekan: fakultasUnit?.file_stempel_fakultas ?? null,

      // Asset kaprodi dari prodi
      paraf_kaprodi: prodi?.file_paraf_kaprodi ?? null,
    },

    dokumen_placeholder: {
      nomor_dokumen: null,
      tanggal_terbit: null,
      tanggal_terbit_formatted: null,
      qr_code: null,
      kode_qr: null,
      url_akses: null,
    },

    batch: {
      id_batch_upload: mahasiswa.batch_upload?.id_batch_upload,
      nomor_batch_upload: mahasiswa.batch_upload?.nomor_batch_upload,
      nama_file: mahasiswa.batch_upload?.nama_file,
      periode: mahasiswa.batch_upload?.periode,
      tahun_lulus: mahasiswa.batch_upload?.tahun_lulus,
    },

    approval,

    transkrip: transkrip.mata_kuliah,
  };
}
