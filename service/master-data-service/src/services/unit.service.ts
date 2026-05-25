import * as unitRepository from "../repositories/unit.repository.js";
import fs from 'fs';
import path from 'path';

// ==================== MESIN PENYIMPAN FILE ====================
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const processFiles = (files: any) => {
  const fileNames: any = {};
  if (files && Array.isArray(files)) {
    files.forEach((file: any) => {
      const uniqueFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);
      fs.writeFileSync(filePath, file.buffer);
      fileNames[file.fieldname] = uniqueFilename;
    });
  }
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

export async function createProdi(data: any) {
  const { id_unit, nama_prodi, nama_prodi_en, kaprodi, nidn_kaprodi, no_sk_akreditasi, files } = data;

  if (!id_unit || !nama_prodi) {
    throw new Error("id_unit dan nama_prodi wajib diisi");
  }

  const existingUnit = await unitRepository.findUnitByIdDB(Number(id_unit));
  if (!existingUnit) {
    throw new Error("Unit tidak ditemukan");
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
  return unitRepository.findProdiByUnitIdDB(Number(id_unit));
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