import * as unitRepository from "../repositories/unit.repository.js";
import fs from 'fs';
import path from 'path';

// ==================== MESIN PENYIMPAN FILE ====================
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const processFiles = (files: any) => {
  const fileNames: Record<string, string> = {};

  if (!files) {
    return fileNames;
  }

  const fileList: any[] = [];

  // Jika dari upload.any()
  if (Array.isArray(files)) {
    fileList.push(...files);
  }

  // Jika dari upload.fields()
  else if (typeof files === "object") {
    Object.values(files).forEach((value: any) => {
      if (Array.isArray(value)) {
        fileList.push(...value);
      }
    });
  }

  fileList.forEach((file: any) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedExt = [".png", ".jpg", ".jpeg", ".webp"];

    if (!allowedExt.includes(ext)) {
      throw new Error(
        `File ${file.originalname} tidak valid. Paraf/TTD/Stempel harus berupa gambar.`,
      );
    }

    const uniqueFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    fileNames[file.fieldname] = uniqueFilename;
  });

  return fileNames;
};
// ==============================================================

// ==================== UNIT SERVICE ====================

export async function createUnit(data: any) {
  const { 
    jenis_unit, nama_unit, nama_unit_en, akreditasi_aipt, 
    rektor, nidn_rektor, wakil_rektor_1, nidn_wakil_rektor_1, tu_rektorat, 
    dekan, nidn_dekan, wakil_dekan_1, nidn_wakil_dekan_1, tu_fakultas,
    files 
  } = data;

  const uploadedFiles = processFiles(files);
  console.log("[editProdi] raw files:", files);
console.log("[editProdi] uploadedFiles:", uploadedFiles);
  
  // Amankan jenis unit ke lowercase
  const exactJenisUnit = jenis_unit ? jenis_unit.toLowerCase() : 'fakultas';
  const isUni = exactJenisUnit === "universitas";

  let finalParentId = null;
  if(!isUni) {
    const universitas = await unitRepository.findUniversitasDB();
    if(!universitas){
      throw new Error("Data Universitas belum ada di sistem! Silahkan buat Universitas terlebih dahulu!");
    }
    finalParentId = universitas.id_unit;
  }

  return unitRepository.createUnitDB({ 
    jenis_unit: exactJenisUnit, 
    nama_unit, nama_unit_en, akreditasi_aipt, 
    rektor, nidn_rektor, wakil_rektor_1, nidn_wakil_rektor_1, tu_rektorat, 
    dekan, nidn_dekan, wakil_dekan_1, nidn_wakil_dekan_1, tu_fakultas, 
    
    // 🔥 MAPPING FILE CREATE: Frontend selalu kirim 'file_ttd_dekan', kita arahkan sesuai jenisnya
    file_ttd_rektor: isUni ? (uploadedFiles['file_ttd_dekan'] || null) : null, 
    file_paraf_warek: isUni ? (uploadedFiles['file_paraf_wadek'] || null) : null, 
    file_paraf_tu_rektorat: isUni ? (uploadedFiles['file_paraf_tu_fakultas'] || null) : null, 
    file_stempel_universitas: isUni ? (uploadedFiles['file_stempel_fakultas'] || null) : null, 
    
    file_ttd_dekan: !isUni ? (uploadedFiles['file_ttd_dekan'] || null) : null, 
    file_paraf_wadek: !isUni ? (uploadedFiles['file_paraf_wadek'] || null) : null, 
    file_paraf_tu_fakultas: !isUni ? (uploadedFiles['file_paraf_tu_fakultas'] || null) : null, 
    file_stempel_fakultas: !isUni ? (uploadedFiles['file_stempel_fakultas'] || null) : null,
    
    parent_id: finalParentId 
  });
}

export async function getAllUnits() {
  return unitRepository.findAllUnitsDB();
}

export async function deleteUnit(id: string, deletedBy?: number | null) {
  const unitId = Number(id);

  if (Number.isNaN(unitId)) {
    throw new Error("ID unit tidak valid");
  }

  const existingUnit = await unitRepository.findUnitByIdDB(unitId);

  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }

  if (existingUnit.deleted_at) {
    throw new Error("Unit sudah dihapus");
  }

  const deletedUnit = await unitRepository.deleteUnitByIdDB(
    unitId,
    deletedBy || null,
  );

  await unitRepository.clearRefreshTokenByUnitDB(unitId);

  return deletedUnit;
}

export async function restoreUnit(id: string) {
  const unitId = Number(id);

  if (Number.isNaN(unitId)) {
    throw new Error("ID unit tidak valid");
  }

  const existingUnit = await unitRepository.findUnitByIdDB(unitId);

  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }

  if (!existingUnit.deleted_at) {
    throw new Error("Unit belum dihapus, tidak perlu direstore");
  }

  return unitRepository.restoreUnitByIdDB(unitId);
}

export async function editUnit(id: string, data: any) {
  const unitId = Number(id);
  const { 
    jenis_unit, nama_unit, nama_unit_en, akreditasi_aipt, 
    rektor, nidn_rektor, wakil_rektor_1, nidn_wakil_rektor_1, tu_rektorat, 
    dekan, nidn_dekan, wakil_dekan_1, nidn_wakil_dekan_1, tu_fakultas,
    files
  } = data;

  const existingUnit = await unitRepository.findUnitByIdDB(unitId);
  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }
  if (existingUnit.deleted_at) {
  throw new Error("Unit sudah dihapus dan tidak bisa diedit");
}
  if (existingUnit.deleted_at) {
  throw new Error("Unit sudah dihapus dan tidak bisa diedit");
}

  const uploadedFiles = processFiles(files);
  const exactJenisUnit = jenis_unit ? jenis_unit.toLowerCase() : existingUnit.jenis_unit;
  const isUni = exactJenisUnit === "universitas";

  return unitRepository.updateUnitByIdDB(unitId, {
    jenis_unit: exactJenisUnit, 
    nama_unit, nama_unit_en, akreditasi_aipt, 
    rektor, nidn_rektor, wakil_rektor_1, nidn_wakil_rektor_1, tu_rektorat, 
    dekan, nidn_dekan, wakil_dekan_1, nidn_wakil_dekan_1, tu_fakultas, 
    
    // 🔥 MAPPING FILE EDIT: Jika ada file baru dari frontend (yang kuncinya selalu file_ttd_dekan dkk), pakai itu. Jika kosong, pakai yang lama dari DB.
    file_ttd_rektor: isUni ? (uploadedFiles['file_ttd_dekan'] || existingUnit.file_ttd_rektor) : null, 
    file_paraf_warek: isUni ? (uploadedFiles['file_paraf_wadek'] || existingUnit.file_paraf_warek) : null, 
    file_paraf_tu_rektorat: isUni ? (uploadedFiles['file_paraf_tu_fakultas'] || existingUnit.file_paraf_tu_rektorat) : null, 
    file_stempel_universitas: isUni ? (uploadedFiles['file_stempel_fakultas'] || existingUnit.file_stempel_universitas) : null, 
    
    file_ttd_dekan: !isUni ? (uploadedFiles['file_ttd_dekan'] || existingUnit.file_ttd_dekan) : null, 
    file_paraf_wadek: !isUni ? (uploadedFiles['file_paraf_wadek'] || existingUnit.file_paraf_wadek) : null, 
    file_paraf_tu_fakultas: !isUni ? (uploadedFiles['file_paraf_tu_fakultas'] || existingUnit.file_paraf_tu_fakultas) : null, 
    file_stempel_fakultas: !isUni ? (uploadedFiles['file_stempel_fakultas'] || existingUnit.file_stempel_fakultas) : null
  });
}

// ==================== PRODI SERVICE ====================

export async function   Prodi(data: any) {
  const { id_unit, nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, no_sk_akreditasi, files } = data;

  if (!id_unit || !nama_prodi) {
    throw new Error("id_unit dan nama_prodi wajib diisi");
  }

  const existingUnit = await unitRepository.findUnitByIdDB(Number(id_unit));
  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }
  if (existingUnit.deleted_at) {
  throw new Error("Unit sudah dihapus, tidak bisa menambahkan prodi");
}

  if (existingUnit.deleted_at) {
  throw new Error("Unit sudah dihapus, tidak bisa menambahkan prodi");
}

  const uploadedFiles = processFiles(files);

  try {
    return await unitRepository.createProdiDB({
      id_unit: Number(id_unit),
      nama_prodi,
      nama_prodi_en,
      kaprodi,
      nidn_kaprodi,
      file_paraf_kaprodi: uploadedFiles['file_paraf_kaprodi'] || data.file_paraf_kaprodi || null,
      no_sk_akreditasi
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Prodi dengan nama tersebut sudah terdaftar di unit ini");
    }
    throw error;
  }
}

export async function getProdiByUnit(id_unit: string) {
  const unitId = Number(id_unit);

  if (Number.isNaN(unitId)) {
    throw new Error("ID unit tidak valid");
  }

  const existingUnit = await unitRepository.findUnitByIdDB(unitId);

  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
  }

  if (existingUnit.deleted_at) {
    throw new Error("Unit sudah dihapus");
  }

  return unitRepository.findProdiByUnitIdDB(unitId);
}

export async function editProdi(id: string, data: any) {
  const prodiId = Number(id);
  const { nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, no_sk_akreditasi, files } = data;

  const existingProdi = await unitRepository.findProdiByIdDB(prodiId);
  if (!existingProdi) {
    throw new Error("Prodi tidak ditemukan");
  }

  const uploadedFiles = processFiles(files);

  return unitRepository.updateProdiByIdDB(prodiId, {
    nama_prodi,
    nama_prodi_en,
    kaprodi,
    nidn_kaprodi,
    file_paraf_kaprodi: uploadedFiles['file_paraf_kaprodi'] || existingProdi.file_paraf_kaprodi,
    no_sk_akreditasi
  });
}

export async function deleteProdi(id: string, deletedBy?: number | null) {
  const prodiId = Number(id);

  if (Number.isNaN(prodiId)) {
    throw new Error("ID prodi tidak valid");
  }

  const existingProdi = await unitRepository.findProdiByIdDB(prodiId);

  if (!existingProdi) {
    throw new Error("Prodi tidak ditemukan");
  }

  if (existingProdi.deleted_at) {
    throw new Error("Prodi sudah dihapus");
  }

  return unitRepository.deleteProdiByIdDB(prodiId, deletedBy || null);
}

export async function restoreProdi(id: string) {
  const prodiId = Number(id);

  if (Number.isNaN(prodiId)) {
    throw new Error("ID prodi tidak valid");
  }

  const existingProdi = await unitRepository.findProdiByIdDB(prodiId);

  if (!existingProdi) {
    throw new Error("Prodi tidak ditemukan");
  }

  if (!existingProdi.deleted_at) {
    throw new Error("Prodi belum dihapus, tidak perlu direstore");
  }

  return unitRepository.restoreProdiByIdDB(prodiId);
}