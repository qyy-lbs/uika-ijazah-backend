import prisma from "../prisma/prisma.js";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "../types/auth.type.js";
import { isFacultyValidator } from "../constants/approval-level.constant.js";

const APPROVAL_LEVEL_LABEL: Record<number, string> = {
  1: "TU Fakultas",
  2: "Wakil Dekan",
  3: "Dekan",
  4: "TU Rektorat",
  5: "Wakil Rektor",
  6: "Rektor",
};

function getNextLevelLabel(lastApprovedLevel: number): string {
  const nextLevel = lastApprovedLevel + 1;
  return APPROVAL_LEVEL_LABEL[nextLevel] ?? "Selesai";
}

function getLaporanStatus(
  validasiList: {
    level_validasi: number;
    status_validasi: string | null;
    validated_at: Date | null;
  }[]
) {
  const rejected = validasiList.find(
    (item) => item.status_validasi?.toLowerCase() === "rejected"
  );

  if (rejected) {
    return {
      status: "Reject",
      keterangan: `Di Reject oleh ${APPROVAL_LEVEL_LABEL[rejected.level_validasi]}`,
      tanggal: rejected.validated_at,
    };
  }

  const revoked = validasiList.find(
    (item) => item.status_validasi?.toLowerCase() === "revoked"
  );

  if (revoked) {
    return {
      status: "Revoke",
      keterangan: `Di Revoke oleh ${APPROVAL_LEVEL_LABEL[revoked.level_validasi]}`,
      tanggal: revoked.validated_at,
    };
  }

  const approvedList = validasiList
    .filter((item) => item.status_validasi?.toLowerCase() === "approved")
    .sort((a, b) => a.level_validasi - b.level_validasi);

  const lastApproved = approvedList[approvedList.length - 1];

  if (lastApproved?.level_validasi === 6) {
    return {
      status: "Terbit",
      keterangan: "Dokumen ijazah dan transkrip sudah terbit",
      tanggal: lastApproved.validated_at,
    };
  }

  const lastApprovedLevel = lastApproved?.level_validasi ?? 0;
  const nextValidator = getNextLevelLabel(lastApprovedLevel);

  return {
    status: "Proses",
    keterangan: `Di Proses Validasi oleh ${nextValidator}`,
    tanggal: lastApproved?.validated_at ?? null,
  };
}

export async function getLaporanApprovalForUser(
  user: AuthUser,
  query?: {
    search?: string;
    status?: string;
  }
) {
  const where: Prisma.mahasiswaWhereInput = {};

  if (query?.search && query.search.trim() !== "") {
    const search = query.search.trim();

    where.OR = [
      {
        nama_mahasiswa: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        nim: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        prodi: {
          is: {
            nama_prodi: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const mahasiswaList = await prisma.mahasiswa.findMany({
    where,
    include: {
      prodi: {
        include: {
          unit: true,
        },
      },
      validasi: {
        orderBy: {
          level_validasi: "asc",
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  let filteredMahasiswa = mahasiswaList;

  if (isFacultyValidator(user.role)) {
    filteredMahasiswa = filteredMahasiswa.filter(
      (mhs) => mhs.prodi?.id_unit === user.id_unit
    );
  }

  const laporan = filteredMahasiswa.map((mhs) => {
    const statusInfo = getLaporanStatus(
      mhs.validasi.map((v) => ({
        level_validasi: v.level_validasi,
        status_validasi: v.status_validasi,
        validated_at: v.validated_at,
      }))
    );

    const tanggal = statusInfo.tanggal ?? mhs.created_at;

    return {
      id_mahasiswa: mhs.id_mahasiswa,
      nama: mhs.nama_mahasiswa,
      nim: mhs.nim,
      program_studi: mhs.prodi?.nama_prodi,
      fakultas: mhs.prodi?.unit?.nama_unit,
      tanggal,
      waktu: tanggal,
      status: statusInfo.status,
      keterangan: statusInfo.keterangan,
    };
  });

  if (query?.status && query.status.trim() !== "") {
    const status = query.status.trim().toLowerCase();

    return laporan.filter((item) => item.status.toLowerCase() === status);
  }

  return laporan;
}