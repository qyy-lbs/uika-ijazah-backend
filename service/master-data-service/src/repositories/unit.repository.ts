import { getPrisma } from "../prisma/prisma.js";

const prisma = getPrisma();

// ==================== UNIT REPOSITORY ====================
export async function findUniversitasDB() {
  return prisma.unit.findFirst({
    where: {
      jenis_unit: "universitas",
      deleted_at: null,
    },
  });
}

export async function createUnitDB(data: any) {
  return prisma.unit.create({ data });
}

export async function findAllUnitsDB() {
  return prisma.unit.findMany({
    where: {
      deleted_at: null,
    },
    include: {
      prodi: {
        where: {
          deleted_at: null,
        },
        orderBy: {
          nama_prodi: "asc",
        },
      },
    },
    orderBy: [
      { jenis_unit: "asc" },
      { nama_unit: "asc" },
    ],
  });
}
export async function findUnitByIdDB(id_unit: number) {
  return prisma.unit.findUnique({
    where: { id_unit }
  });
}

export async function deleteUnitByIdDB(
  id_unit: number,
  deletedBy?: number | null,
) {
  return prisma.unit.update({
    where: { id_unit },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy || null,
      updated_at: new Date(),
    },
  });
}

export async function restoreUnitByIdDB(id_unit: number) {
  return prisma.unit.update({
    where: { id_unit },
    data: {
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date(),
    },
  });
}

export async function updateUnitByIdDB(id_unit: number, data: any) {
  return prisma.unit.update({
    where: { id_unit },
    data
  });
}

export async function clearRefreshTokenByUnitDB(id_unit: number) {
  return prisma.users.updateMany({
    where: {
      id_unit,
      deleted_at: null,
    },
    data: {
      refresh_token: null,
      updated_at: new Date(),
    },
  });
}

// ==================== PRODI REPOSITORY ====================

export async function createProdiDB(data: any) {
  return prisma.prodi.create({
    data,
    include: {
      unit: {
        select: { id_unit: true, nama_unit: true, jenis_unit: true }
      }
    }
  });
}

export async function findProdiByUnitIdDB(id_unit: number) {
  return prisma.prodi.findMany({
    where: {
      id_unit,
      deleted_at: null,
    },
    orderBy: {
      nama_prodi: "asc",
    },
  });
}
export async function findProdiByIdDB(id_prodi: number) {
  return prisma.prodi.findUnique({
    where: { id_prodi }
  });
}

export async function updateProdiByIdDB(id_prodi: number, data: any) {
  return prisma.prodi.update({
    where: { id_prodi },
    data: {
      ...data,
      updated_at: new Date()
    }
  });
}

export async function deleteProdiByIdDB(
  id_prodi: number,
  deletedBy?: number | null,
) {
  return prisma.prodi.update({
    where: { id_prodi },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy || null,
      updated_at: new Date(),
    },
  });
}

export async function restoreProdiByIdDB(id_prodi: number) {
  return prisma.prodi.update({
    where: { id_prodi },
    data: {
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date(),
    },
  });
}


