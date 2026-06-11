import { findBatchByIdWithMahasiswa } from "../repositories/batch.repository.js";
import {
  getApprovalLevelByRole,
  isFacultyValidator,
} from "../constants/approval-level.constant.js";
import type { AuthUser } from "../types/auth.type.js";
import {
  createValidasi,
  findValidasiByMahasiswaAndLevel,
  updateValidasi,
} from "../repositories/validasi.repository.js";
import { VALIDATION_STATUS } from "../constants/status.constant.js";
import { createLogAktivitas } from "../repositories/log.repository.js";
import { archiveMahasiswaUniqueFields } from "../repositories/mahasiswa-archive.repository.js";

function isAlreadyFinalStatus(
  validasiList: { status_validasi: string | null }[],
) {
  return validasiList.some((item) => {
    const status = item.status_validasi?.toLowerCase();
    return (
      status === VALIDATION_STATUS.REJECTED ||
      status === VALIDATION_STATUS.REVOKED
    );
  });
}

function hasStatusAtLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  level: number,
  status: string,
) {
  return validasiList.some(
    (item) =>
      item.level_validasi === level &&
      item.status_validasi?.toLowerCase() === status,
  );
}

function canRejectAtLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  currentLevel: number,
) {
  if (isAlreadyFinalStatus(validasiList)) {
    return false;
  }

  if (
    hasStatusAtLevel(validasiList, currentLevel, VALIDATION_STATUS.APPROVED)
  ) {
    return false;
  }

  if (currentLevel === 1) {
    return true;
  }

  return hasStatusAtLevel(
    validasiList,
    currentLevel - 1,
    VALIDATION_STATUS.APPROVED,
  );
}

export async function rejectBatchForUser(
  batchId: number,
  user: AuthUser,
  catatan: string,
) {
  const approvalLevel = getApprovalLevelByRole(user.role);

  if (!approvalLevel) {
    throw new Error("Role tidak memiliki level approval");
  }

  if (!catatan || catatan.trim() === "") {
    throw new Error("Catatan wajib diisi saat reject batch");
  }

  const batch = await findBatchByIdWithMahasiswa(batchId);

  if (!batch) {
    throw new Error("Batch tidak ditemukan");
  }

  let mahasiswa = batch.mahasiswa;

  // Validator fakultas hanya boleh reject batch dari fakultasnya sendiri
  if (isFacultyValidator(user.role)) {
    mahasiswa = mahasiswa.filter((mhs) => mhs.prodi?.id_unit === user.id_unit);
  }

  if (mahasiswa.length === 0) {
    throw new Error("Anda tidak memiliki akses untuk menolak batch ini");
  }

  const mahasiswaEligible = mahasiswa.filter((mhs) => {
    const validasiList = mhs.validasi.map((v) => ({
      level_validasi: v.level_validasi,
      status_validasi: v.status_validasi,
    }));

    return canRejectAtLevel(validasiList, approvalLevel);
  });

  if (mahasiswaEligible.length === 0) {
    throw new Error("Tidak ada mahasiswa yang dapat direject pada level ini");
  }

  const results = [];

  for (const mhs of mahasiswaEligible) {
    const existing = await findValidasiByMahasiswaAndLevel(
      mhs.id_mahasiswa,
      approvalLevel,
    );

    if (existing) {
      const updated = await updateValidasi(existing.id_validasi, {
        validated_by: user.id_user,
        status_validasi: VALIDATION_STATUS.REJECTED,
        catatan,
      });

      results.push(updated);
    } else {
      const created = await createValidasi({
        id_mahasiswa: mhs.id_mahasiswa,
        validated_by: user.id_user,
        level_validasi: approvalLevel,
        status_validasi: VALIDATION_STATUS.REJECTED,
        catatan,
      });

      results.push(created);
    }
    await archiveMahasiswaUniqueFields({
      id_mahasiswa: mhs.id_mahasiswa,
      type: "RJ",
    });
  }

  await createLogAktivitas({
    id_user: user.id_user,
    aktivitas: "REJECT_BATCH",
    deskripsi: `${user.role} menolak batch ${
      batch.nomor_batch_upload ?? batch.id_batch_upload
    } pada level ${approvalLevel}. Total mahasiswa ditolak: ${results.length}`,
  });

  return {
    batch: {
      id_batch_upload: batch.id_batch_upload,
      nomor_batch_upload: batch.nomor_batch_upload,
      nama_file: batch.nama_file,
      tahun_lulus: batch.tahun_lulus,
      periode: batch.periode,
    },
    approval: {
      role: user.role,
      level: approvalLevel,
      status: VALIDATION_STATUS.REJECTED,
      rejected_count: results.length,
      catatan,
    },
    mahasiswa: mahasiswaEligible.map((mhs) => ({
      id_mahasiswa: mhs.id_mahasiswa,
      nim: mhs.nim,
      nama_mahasiswa: mhs.nama_mahasiswa,
      program_studi: mhs.prodi?.nama_prodi,
      fakultas: mhs.prodi?.unit?.nama_unit,
    })),
  };
}
