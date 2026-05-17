import prisma from "../prisma/prisma.js";
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

function isAlreadyRejectedOrRevoked(
  validasiList: { status_validasi: string | null }[]
) {
  return validasiList.some((item) => {
    const status = item.status_validasi?.toLowerCase();
    return status === "rejected" || status === "revoked";
  });
}

function canRevokeAtLevel(
  validasiList: { level_validasi: number; status_validasi: string | null }[],
  currentLevel: number
) {
  if (isAlreadyRejectedOrRevoked(validasiList)) {
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

export async function revokeMahasiswaForUser(
  nim: string,
  user: AuthUser,
  catatan: string
) {
  const approvalLevel = getApprovalLevelByRole(user.role);

  if (!approvalLevel) {
    throw new Error("Role tidak memiliki level approval");
  }

  if (!catatan || catatan.trim() === "") {
    throw new Error("Catatan wajib diisi saat revoke mahasiswa");
  }

  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: {
      nim,
    },
    include: {
      prodi: {
        include: {
          unit: true,
        },
      },
      batch_upload: true,
      validasi: {
        orderBy: {
          level_validasi: "asc",
        },
      },
    },
  });

  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak ditemukan");
  }

  if (isFacultyValidator(user.role)) {
    if (mahasiswa.prodi?.id_unit !== user.id_unit) {
      throw new Error("Anda tidak memiliki akses untuk revoke mahasiswa dari fakultas ini");
    }
  }

  const validasiList = mahasiswa.validasi.map((v) => ({
    level_validasi: v.level_validasi,
    status_validasi: v.status_validasi,
  }));

  if (!canRevokeAtLevel(validasiList, approvalLevel)) {
    throw new Error("Mahasiswa tidak dapat direvoke pada level ini");
  }

  const existing = await findValidasiByMahasiswaAndLevel(
    mahasiswa.id_mahasiswa,
    approvalLevel
  );

  const result = existing
    ? await updateValidasi(existing.id_validasi, {
        validated_by: user.id_user,
        status_validasi: "revoked",
        catatan,
      })
    : await createValidasi({
        id_mahasiswa: mahasiswa.id_mahasiswa,
        validated_by: user.id_user,
        level_validasi: approvalLevel,
        status_validasi: "revoked",
        catatan,
      });

  return {
    mahasiswa: {
      id_mahasiswa: mahasiswa.id_mahasiswa,
      nim: mahasiswa.nim,
      nama_mahasiswa: mahasiswa.nama_mahasiswa,
      program_studi: mahasiswa.prodi?.nama_prodi,
      fakultas: mahasiswa.prodi?.unit?.nama_unit,
      id_batch_upload: mahasiswa.id_batch_upload,
      nomor_batch_upload: mahasiswa.batch_upload?.nomor_batch_upload,
    },
    approval: {
      role: user.role,
      level: approvalLevel,
      status: "revoked",
      catatan,
      validated_by: user.id_user,
      validated_at: result.validated_at,
    },
  };
}