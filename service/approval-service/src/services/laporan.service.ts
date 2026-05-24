import prisma from "../prisma/prisma.js";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "../types/auth.type.js";
import { isFacultyValidator, canViewAllLaporan } from "../constants/approval-level.constant.js";
import {
  REPORT_STATUS,
  VALIDATION_STATUS,
} from "../constants/status.constant.js";

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
  }[],
) {
  const rejected = validasiList.find(
    (item) =>
      item.status_validasi?.toLowerCase() === VALIDATION_STATUS.REJECTED,
  );

  if (rejected) {
    return {
      status: VALIDATION_STATUS.REJECTED,
      keterangan: `Di Reject oleh ${APPROVAL_LEVEL_LABEL[rejected.level_validasi]}`,
      tanggal: rejected.validated_at,
    };
  }

  const revoked = validasiList.find(
    (item) => item.status_validasi?.toLowerCase() === VALIDATION_STATUS.REVOKED,
  );

  if (revoked) {
    return {
      status: VALIDATION_STATUS.REVOKED,
      keterangan: `Di Revoke oleh ${APPROVAL_LEVEL_LABEL[revoked.level_validasi]}`,
      tanggal: revoked.validated_at,
    };
  }

  const approvedList = validasiList
    .filter(
      (item) =>
        item.status_validasi?.toLowerCase() === VALIDATION_STATUS.APPROVED,
    )
    .sort((a, b) => a.level_validasi - b.level_validasi);

  const lastApproved = approvedList[approvedList.length - 1];

  if (lastApproved?.level_validasi === 6) {
    return {
      status: REPORT_STATUS.TERBIT,
      keterangan: "Dokumen ijazah dan transkrip sudah terbit",
      tanggal: lastApproved.validated_at,
    };
  }

  const lastApprovedLevel = lastApproved?.level_validasi ?? 0;
  const nextValidator = getNextLevelLabel(lastApprovedLevel);

  return {
    status: REPORT_STATUS.PROSES,
    keterangan: `Di Proses Validasi oleh ${nextValidator}`,
    tanggal: lastApproved?.validated_at ?? null,
  };
}

export async function getLaporanApprovalForUser(
  user: AuthUser,
  query: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  },
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

if (!canViewAllLaporan(user.role) && isFacultyValidator(user.role)) {
  filteredMahasiswa = filteredMahasiswa.filter(
    (mhs) => mhs.prodi?.id_unit === user.id_unit,
  );
}

  const laporan = filteredMahasiswa.map((mhs) => {
    const statusInfo = getLaporanStatus(
      mhs.validasi.map((v) => ({
        level_validasi: v.level_validasi,
        status_validasi: v.status_validasi,
        validated_at: v.validated_at,
      })),
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

  const filteredByStatus = query.status
    ? laporan.filter(
        (item) => item.status.toLowerCase() === query.status?.toLowerCase(),
      )
    : laporan;

  const totalData = filteredByStatus.length;
  const totalPage = Math.ceil(totalData / query.limit);

  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;

  const paginatedData = filteredByStatus.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page: query.page,
      limit: query.limit,
      total_data: totalData,
      total_page: totalPage,
    },
  };
}
