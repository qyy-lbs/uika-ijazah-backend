import {
  findDokumenByKodeQr,
  findBlockchainByDokumen,
} from "../repositories/dokumen.repository.js";

import { generateSha256FromFile } from "../utils/hash.util.js";
import { resolveDocumentPdfPath } from "../utils/document-file.util.js";

function buildPdfUrl(filePath: string | null) {
  if (!filePath) return null;

  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  if (filePath.startsWith("/")) {
    return `${baseUrl}${filePath}`;
  }

  return `${baseUrl}/${filePath}`;
}

export async function verifyDocumentByKodeQr(kodeQr: string) {
  if (!kodeQr || kodeQr.trim() === "") {
    throw new Error("Kode QR wajib diisi");
  }

  const dokumen = await findDokumenByKodeQr(kodeQr);

  if (!dokumen) {
    return {
      is_valid: false,
      reason: "DOKUMEN_TIDAK_DITEMUKAN",
      message: "Dokumen tidak ditemukan atau QR tidak valid",
      kode_qr: kodeQr,
    };
  }

  const blockchain = await findBlockchainByDokumen(dokumen.id_dokumen);

  if (!blockchain) {
    return {
      is_valid: false,
      reason: "BLOCKCHAIN_TIDAK_DITEMUKAN",
      message: "Data blockchain dokumen tidak ditemukan",
      kode_qr: dokumen.kode_qr,
      jenis_dokumen: dokumen.jenis_dokumen,
      nomor_dokumen: dokumen.nomor_dokumen,
      tanggal_terbit: dokumen.tanggal_terbit,
      is_verified: dokumen.is_verified,
      url_akses: dokumen.url_akses,

      file_pdf: dokumen.file_pdf,
      file_pdf_final: dokumen.file_pdf_final,
      file_pdf_url: buildPdfUrl(dokumen.file_pdf_final || dokumen.file_pdf),

      mahasiswa: {
        id_mahasiswa: dokumen.mahasiswa?.id_mahasiswa,
        nim: dokumen.mahasiswa?.nim,
        nama_mahasiswa: dokumen.mahasiswa?.nama_mahasiswa,
        nik: dokumen.mahasiswa?.nik,
        tempat_lahir: dokumen.mahasiswa?.tempat_lahir,
        tanggal_lahir: dokumen.mahasiswa?.tanggal_lahir,
        jenis_kelamin: dokumen.mahasiswa?.jenis_kelamin,
        foto: dokumen.mahasiswa?.foto,
        fakultas: dokumen.mahasiswa?.prodi?.unit?.nama_unit ?? null,
        program_studi: dokumen.mahasiswa?.prodi?.nama_prodi ?? null,
      },

      template: dokumen.template,
      blockchain: null,
    };
  }

  const filePdf = dokumen.file_pdf_final || dokumen.file_pdf;

  let currentHash: string | null = null;
  let hashMatch = false;

  try {
    const pdfPath = resolveDocumentPdfPath(filePdf);
    currentHash = generateSha256FromFile(pdfPath);
    hashMatch = currentHash === blockchain.hash_dokumen;
  } catch (error) {
    return {
      is_valid: false,
      reason: "FILE_PDF_TIDAK_DITEMUKAN",
      message:
        error instanceof Error
          ? error.message
          : "File PDF dokumen tidak ditemukan",
      kode_qr: dokumen.kode_qr,
      jenis_dokumen: dokumen.jenis_dokumen,
      nomor_dokumen: dokumen.nomor_dokumen,
      file_pdf: dokumen.file_pdf,
      file_pdf_final: dokumen.file_pdf_final,
      blockchain: {
        id_blockchain: blockchain.id_blockchain,
        id_dokumen: blockchain.id_dokumen,
        hash_dokumen: blockchain.hash_dokumen,
        hash_block: blockchain.hash_block,
        previous_hash: blockchain.previous_hash,
        index_block: blockchain.index_block,
      },
    };
  }

  return {
    is_valid: hashMatch,
    reason: hashMatch ? "VALID" : "HASH_TIDAK_COCOK",
    message: hashMatch ? "Dokumen valid" : "Hash dokumen tidak cocok",

    kode_qr: dokumen.kode_qr,
    jenis_dokumen: dokumen.jenis_dokumen,
    nomor_dokumen: dokumen.nomor_dokumen,
    tanggal_terbit: dokumen.tanggal_terbit,
    is_verified: dokumen.is_verified,
    url_akses: dokumen.url_akses,

    file_pdf: dokumen.file_pdf,
    file_pdf_final: dokumen.file_pdf_final,
    file_pdf_url: buildPdfUrl(filePdf),

    mahasiswa: {
      id_mahasiswa: dokumen.mahasiswa?.id_mahasiswa,
      nim: dokumen.mahasiswa?.nim,
      nama_mahasiswa: dokumen.mahasiswa?.nama_mahasiswa,
      nik: dokumen.mahasiswa?.nik,
      tempat_lahir: dokumen.mahasiswa?.tempat_lahir,
      tanggal_lahir: dokumen.mahasiswa?.tanggal_lahir,
      jenis_kelamin: dokumen.mahasiswa?.jenis_kelamin,
      foto: dokumen.mahasiswa?.foto,
      fakultas: dokumen.mahasiswa?.prodi?.unit?.nama_unit ?? null,
      program_studi: dokumen.mahasiswa?.prodi?.nama_prodi ?? null,
    },

    template: dokumen.template,

    blockchain: {
      id_blockchain: blockchain.id_blockchain,
      uuid: blockchain.uuid,
      id_dokumen: blockchain.id_dokumen,
      index_block: blockchain.index_block,
      previous_hash: blockchain.previous_hash,
      hash_block: blockchain.hash_block,
      hash_dokumen: blockchain.hash_dokumen,
      current_hash: currentHash,
      hash_match: hashMatch,
      created_at: blockchain.created_at,
    },
  };
}