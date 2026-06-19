import prisma from "../prisma/prisma.js";

export type NotificationUser = {
  id_user?: number;
  role?: string | null;
  id_unit?: number | null;
};

const REJECT_REVOKE_ACTIVITIES = [
  "REJECT_BATCH",
  "REVOKE_MAHASISWA",
];

const FACULTY_ROLES = [
  "tu_fakultas",
  "wakil_dekan_1",
  "wakil_dekan",
  "dekan",
];

export async function findRejectRevokeNotificationsRepository(
  user: NotificationUser,
  limit = 5,
) {
  const role = String(user.role || "")
    .toLowerCase()
    .trim();

  const idUnit = user.id_unit ? Number(user.id_unit) : null;

  const where: any = {
    aktivitas: {
      in: REJECT_REVOKE_ACTIVITIES,
    },
  };

  // Role fakultas hanya melihat reject/revoke dari fakultasnya sendiri
  if (FACULTY_ROLES.includes(role)) {
    if (!idUnit) {
      return [];
    }

    where.users = {
      is: {
        id_unit: idUnit,
      },
    };
  }

  return prisma.log_aktivitas.findMany({
    where,
    orderBy: {
      created_at: "desc",
    },
    take: limit,
    include: {
      users: {
        select: {
          id_user: true,
          role: true,
          email: true,
          unit: {
            select: {
              id_unit: true,
              nama_unit: true,
            },
          },
        },
      },
    },
  });
}