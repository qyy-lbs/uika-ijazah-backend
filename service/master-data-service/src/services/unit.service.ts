import * as unitRepository from "../repositories/unit.repository.js";

// ==================== UNIT SERVICE ====================

export async function createUnit(data: any) {
  const { nama_unit, jenis_unit, rektor, dekan } = data;
  return unitRepository.createUnitDB({ nama_unit, jenis_unit, rektor, dekan });
}

export async function getAllUnits() {
  return unitRepository.findAllUnitsDB();
}

export async function deleteUnit(id: string) {
  const unitId = Number(id);
  const existingUnit = await unitRepository.findUnitByIdDB(unitId);
  
  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }

  return unitRepository.deleteUnitByIdDB(unitId);
}

export async function editUnit(id: string, data: any) {
  const unitId = Number(id);
  const { jenis_unit, nama_unit, dekan, nidn_dekan, wakil_dekan_1, nidn_wakil_dekan_1 } = data;

  const existingUnit = await unitRepository.findUnitByIdDB(unitId);
  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }

  return unitRepository.updateUnitByIdDB(unitId, {
    jenis_unit,
    nama_unit,
    dekan,
    nidn_dekan,
    wakil_dekan_1,
    nidn_wakil_dekan_1
  });
}

// ==================== PRODI SERVICE ====================

export async function createProdi(data: any) {
  const { id_unit, nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, file_paraf_kaprodi, no_sk_akreditasi } = data;

  if (!id_unit || !nama_prodi) {
    throw new Error("id_unit dan nama_prodi wajib diisi");
  }

  const existingUnit = await unitRepository.findUnitByIdDB(Number(id_unit));
  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }

  try {
    return await unitRepository.createProdiDB({
      id_unit: Number(id_unit),
      nama_prodi,
      nama_prodi_en,
      kaprodi,
      nidn_kaprodi,
      file_paraf_kaprodi,
      no_sk_akreditasi
    });
  } catch (error: any) {
    // Menangkap error duplikasi (Unique constraint Prisma)
    if (error.code === 'P2002') {
      throw new Error("Prodi dengan nama tersebut sudah terdaftar di unit ini");
    }
    throw error; // Lempar error lain ke atas
  }
}

export async function getProdiByUnit(id_unit: string) {
  return unitRepository.findProdiByUnitIdDB(Number(id_unit));
}

export async function editProdi(id: string, data: any) {
  const prodiId = Number(id);
  const { nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, file_paraf_kaprodi, no_sk_akreditasi } = data;

  const existingProdi = await unitRepository.findProdiByIdDB(prodiId);
  if (!existingProdi) {
    throw new Error("Prodi tidak ditemukan");
  }

  return unitRepository.updateProdiByIdDB(prodiId, {
    nama_prodi,
    nama_prodi_en,
    kaprodi,
    nidn_kaprodi,
    file_paraf_kaprodi,
    no_sk_akreditasi
  });
}