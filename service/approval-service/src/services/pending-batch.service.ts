import { findAllBatchesWithMahasiswa } from "../repositories/batch.repository.js";
import {
  getApprovalLevelByRole,
  isFacultyValidator,
} from "../constants/approval-level.constant.js";
import type { AuthUser } from "../types/auth.type.js";

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

function isMahasiswaReadyForLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  currentLevel: number
) {
  if (isRevokedOrRejected(validasiList)) {
    return false;
  }

  const alreadyApprovedCurrentLevel = hasStatusAtLevel(
    validasiList,
    currentLevel,
    "approved"
  );

  if (alreadyApprovedCurrentLevel) {
    return false;
  }

  if (currentLevel === 1) {
    return true;
  }

  const previousLevel = currentLevel - 1;

  return hasStatusAtLevel(validasiList, previousLevel, "approved");
}

export async function getPendingBatchesForUser(user: AuthUser) {
  const approvalLevel = getApprovalLevelByRole(user.role);

  if (!approvalLevel) {
    throw new Error("Role tidak memiliki level approval");
  }

  const batches = await findAllBatchesWithMahasiswa();

  const filteredBatches = batches
    .map((batch) => {
      let mahasiswa = batch.mahasiswa;

      // Validator fakultas hanya boleh melihat mahasiswa dari fakultasnya sendiri
      if (isFacultyValidator(user.role)) {
        mahasiswa = mahasiswa.filter((mhs) => {
          return mhs.prodi?.id_unit === user.id_unit;
        });
      }

      const mahasiswaPending = mahasiswa.filter((mhs) =>
        isMahasiswaReadyForLevel(
          mhs.validasi.map((v) => ({
            level_validasi: v.level_validasi,
            status_validasi: v.status_validasi,
          })),
          approvalLevel
        )
      );

      if (mahasiswaPending.length === 0) {
        return null;
      }

      const fakultasSet = new Set(
        mahasiswaPending
          .map((mhs) => mhs.prodi?.unit?.nama_unit)
          .filter(Boolean)
      );

      return {
        id_batch_upload: batch.id_batch_upload,
        uuid: batch.uuid,
        nomor_batch_upload: batch.nomor_batch_upload,
        nama_file: batch.nama_file,
        periode: batch.periode,
        tahun_lulus: batch.tahun_lulus,
        total_record: batch.total_record,
        created_at: batch.created_at,
        approval_level: approvalLevel,
        pending_count: mahasiswaPending.length,
        fakultas: Array.from(fakultasSet),
        mahasiswa: mahasiswaPending.map((mhs) => ({
          id_mahasiswa: mhs.id_mahasiswa,
          nim: mhs.nim,
          nama_mahasiswa: mhs.nama_mahasiswa,
          program_studi: mhs.prodi?.nama_prodi,
          fakultas: mhs.prodi?.unit?.nama_unit,
          tahun_lulus: mhs.tahun_lulus,
        })),
      };
    })
    .filter(Boolean);

  return filteredBatches;
}