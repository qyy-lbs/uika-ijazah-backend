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
  }[]
) {
  const rejected = validasiList.find(
    (item) => item.status_validasi?.toLowerCase() === "rejected"
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
    (item) => item.status_validasi?.toLowerCase() === "revoked"
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

  /**
   * Kalau belum ada validasi sama sekali:
   * lastApprovedLevel = 0
   * next validator = level 1 = TU Fakultas
   */
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

export async function getProfileByNim(nim: string) {
  const mahasiswa = await findMahasiswaByNim(nim);

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  const transkrip = await getTranskripByNim(nim);

  const approval = getMahasiswaApprovalStatus(
    mahasiswa.validasi.map((v) => ({
      level_validasi: v.level_validasi,
      status_validasi: v.status_validasi,
      catatan: v.catatan,
      validated_at: v.validated_at,
    }))
  );

  return {
    mahasiswa: {
      id_mahasiswa: mahasiswa.id_mahasiswa,
      uuid: mahasiswa.uuid,
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
      id_batch_upload: mahasiswa.id_batch_upload,
    },

    akademik: {
      fakultas: mahasiswa.prodi?.unit?.nama_unit,
      program_studi: mahasiswa.prodi?.nama_prodi,
      tahun_masuk: mahasiswa.tahun_masuk,
      tahun_lulus: mahasiswa.tahun_lulus,
      tanggal_kelulusan: mahasiswa.tanggal_kelulusan,
      ipk: transkrip.ipk,
      total_sks: transkrip.total_sks,
      total_bobot: transkrip.total_bobot,
      predikat: transkrip.predikat,
      status_kelulusan: mahasiswa.status_kelulusan,
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