import { getPrisma } from "../prisma/prisma.js";

const prisma = getPrisma();

// ==================== UNIT REPOSITORY ====================
export async function findUniversitasDB() {
  // Mencari unit pertama yang jenisnya adalah 'Universitas'
  return prisma.unit.findFirst({
    where: { jenis_unit: 'universitas' }
  });
}

export async function createUnitDB(data: any) {
  return prisma.unit.create({ data });
}

export async function findAllUnitsDB() {
  return prisma.unit.findMany({
    include: { prodi: true }
  });
}

export async function findUnitByIdDB(id_unit: number) {
  return prisma.unit.findUnique({
    where: { id_unit }
  });
}

export async function deleteUnitByIdDB(id_unit: number) {
  return prisma.unit.delete({
    where: { id_unit }
  });
}

export async function updateUnitByIdDB(id_unit: number, data: any) {
  return prisma.unit.update({
    where: { id_unit },
    data
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
    where: { id_unit },
    orderBy: { nama_prodi: 'asc' }
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