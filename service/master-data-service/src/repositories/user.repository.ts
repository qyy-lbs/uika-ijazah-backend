import { getPrisma } from "../prisma/prisma.js";

const prisma = getPrisma();

export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({ where: { email } });
}

export const findUserById = async (id_user: number) => {
  return await prisma.users.findUnique({
    where: { id_user: Number(id_user) },
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true,

      deleted_at: true,
      deleted_by: true,

      created_at: true,
      updated_at: true,

      unit: true,
    },
  });
};
export async function createNewUser(data: any) {
  return prisma.users.create({
    data,
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true,
      created_at: true,
    },
  });
}

const getUnitPriority = (user: any) => {
  const jenisUnit = String(user.unit?.jenis_unit || "")
    .toLowerCase()
    .trim();

  // Unit paling tinggi
  if (jenisUnit === "universitas") return 1;

  // Fakultas di bawah universitas
  if (jenisUnit === "fakultas") return 2;

  // Fallback kalau jenis_unit kosong tapi parent_id null
  if (user.id_unit && user.unit?.parent_id === null) return 1;

  // Fallback kalau punya unit tapi bukan universitas
  if (user.id_unit) return 2;

  // User tanpa unit taruh paling bawah
  return 3;
};

const rolePriority: Record<string, number> = {
  // Level universitas / rektorat
  rektor: 1,
  warek: 2,
  wakil_rektor_1: 2,
  tu_rektorat: 3,

  // Level fakultas
  dekan: 4,
  wadek: 5,
  wakil_dekan_1: 5,
  tu_fakultas: 6,

  // Lainnya
  operator: 7,
  operator_data: 7,
};

export async function findAllUsers() {
  const users = await prisma.users.findMany({
    where: {
      deleted_at: null,
    },
    include: {
      unit: true,
    },
  });

  return (
    users
      .filter((user) => {
        const role = String(user.role || "")
          .toLowerCase()
          .trim();
        return role !== "admin";
      })

      // Sort berdasarkan unit tertinggi sampai bawah
      .sort((a, b) => {
        const unitPriorityA = getUnitPriority(a);
        const unitPriorityB = getUnitPriority(b);

        if (unitPriorityA !== unitPriorityB) {
          return unitPriorityA - unitPriorityB;
        }

        const unitNameA = String(a.unit?.nama_unit || "ZZZ");
        const unitNameB = String(b.unit?.nama_unit || "ZZZ");

        const unitNameCompare = unitNameA.localeCompare(unitNameB, "id", {
          sensitivity: "base",
        });

        if (unitNameCompare !== 0) {
          return unitNameCompare;
        }

        const roleA = String(a.role || "")
          .toLowerCase()
          .trim();
        const roleB = String(b.role || "")
          .toLowerCase()
          .trim();

        const roleCompare =
          (rolePriority[roleA] || 99) - (rolePriority[roleB] || 99);

        if (roleCompare !== 0) {
          return roleCompare;
        }

        return String(a.email || "").localeCompare(
          String(b.email || ""),
          "id",
          {
            sensitivity: "base",
          },
        );
      })
  );
}

export async function removeUserById(id_user: number, deletedBy?: number | null) {
  return prisma.users.update({
    where: { id_user },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy || null,
      updated_at: new Date(),
    },
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      deleted_at: true,
      deleted_by: true,
      updated_at: true,
    },
  });
}

export async function updateUserById(id_user: number, data: any) {
  return prisma.users.update({
    where: { id_user },
    data,
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true,
    },
  });
}

export async function restoreUserById(id_user: number) {
  return prisma.users.update({
    where: { id_user },
    data: {
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date(),

      // Opsional:
      // Kalau sebelumnya pernah pakai is_active false saat testing,
      // boleh aktifkan lagi supaya aman.
      is_active: true,
    },
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true,
      deleted_at: true,
      deleted_by: true,
      updated_at: true,
      unit: true,
    },
  });
}
