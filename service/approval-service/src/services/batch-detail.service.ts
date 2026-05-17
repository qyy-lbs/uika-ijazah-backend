import { findBatchByIdWithMahasiswa } from "../repositories/batch.repository.js";
import {
  getApprovalLevelByRole,
  isFacultyValidator,
} from "../constants/approval-level.constant.js";
import type { AuthUser } from "../types/auth.type.js";

function getStatusAtLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  level: number
) {
  return (
    validasiList.find((item) => item.level_validasi === level)
      ?.status_validasi ?? null
  );
}

function hasStatusAtLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  level: number,
  status: string
) {
  return validasiList.some(
    (item) =>
      item.level_validasi === level &&
      item.status_validasi?.toLowerCase() === status
  );
}

function isRevokedOrRejected(
  validasiList: { status_validasi: string | null }[]
) {
  return validasiList.some((item) => {
    const status = item.status_validasi?.toLowerCase();
    return status === "revoked" || status === "rejected";
  });
}

function canValidateAtLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  currentLevel: number
) {
  if (isRevokedOrRejected(validasiList)) {
    return false;
  }

  if (hasStatusAtLevel(validasiList, currentLevel, "approved")) {
    return false;
  }

  if (currentLevel === 1) {
    return true;
  }

  return hasStatusAtLevel(validasiList, currentLevel - 1, "approved");
}

export async function getBatchDetailForUser(batchId: number, user: AuthUser) {
  const approvalLevel = getApprovalLevelByRole(user.role);

  if (!approvalLevel) {
    throw new Error("Role tidak memiliki level approval");
  }

  const batch = await findBatchByIdWithMahasiswa(batchId);

  if (!batch) {
    throw new Error("Batch tidak ditemukan");
  }

  let mahasiswa = batch.mahasiswa;

  if (isFacultyValidator(user.role)) {
    mahasiswa = mahasiswa.filter((mhs) => mhs.prodi?.id_unit === user.id_unit);
  }

  if (mahasiswa.length === 0) {
    throw new Error("Anda tidak memiliki akses ke batch ini");
  }

  const mahasiswaList = mahasiswa.map((mhs) => {
    const validasiList = mhs.validasi.map((v) => ({
      level_validasi: v.level_validasi,
      status_validasi: v.status_validasi,
    }));

    return {
      id_mahasiswa: mhs.id_mahasiswa,
      nim: mhs.nim,
      nama_mahasiswa: mhs.nama_mahasiswa,
      program_studi: mhs.prodi?.nama_prodi,
      fakultas: mhs.prodi?.unit?.nama_unit,
      tahun_lulus: mhs.tahun_lulus,
      status_kelulusan: mhs.status_kelulusan,

      current_approval_level: approvalLevel,
      current_level_status: getStatusAtLevel(validasiList, approvalLevel),
      can_validate: canValidateAtLevel(validasiList, approvalLevel),

      validasi: mhs.validasi.map((v) => ({
        id_validasi: v.id_validasi,
        level_validasi: v.level_validasi,
        status_validasi: v.status_validasi,
        catatan: v.catatan,
        validated_by: v.validated_by,
        validated_at: v.validated_at,
      })),
    };
  });

  const canValidateCount = mahasiswaList.filter((mhs) => mhs.can_validate).length;

  return {
    batch: {
      id_batch_upload: batch.id_batch_upload,
      uuid: batch.uuid,
      nomor_batch_upload: batch.nomor_batch_upload,
      nama_file: batch.nama_file,
      periode: batch.periode,
      tahun_lulus: batch.tahun_lulus,
      total_record: batch.total_record,
      record_berhasil: batch.record_berhasil,
      record_gagal: batch.record_gagal,
      created_at: batch.created_at,
    },
    approval: {
      role: user.role,
      level: approvalLevel,
      can_validate_count: canValidateCount,
    },
    mahasiswa: mahasiswaList,
  };
}