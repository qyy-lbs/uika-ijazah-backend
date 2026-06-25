import path from "path";
import { findDokumenByKodeQr } from "../repositories/dokumen.repository.js";
import { verifyDocumentInBlockchain } from "../clients/blockchain.client.js";
import { createFileSha256 } from "../utils/file-hash.util.js";

type RawBlockchainBlock = {
  id_blockchain: number;
  uuid: string | null;
  id_dokumen: number | null;
  hash_dokumen: string | null;
  index_block: number | null;
  hash_block: string | null;
  previous_hash: string | null;
  created_at: Date | string | null;
} | null;

function resolveDocumentLocalPath(filePath: string | null) {
  if (!filePath) return null;

  const cleanPath = filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\/documents\/?/, "");

  return path.join(process.cwd(), "uploads", "documents", cleanPath);
}

async function buildPdfHashStatus(
  filePath: string | null,
  blockchainHash: string | null | undefined,
) {
  if (!filePath) {
    return {
      is_hash_match: false,
      current_hash: null,
      blockchain_hash: blockchainHash ?? null,
      message: "File PDF tidak ditemukan pada data dokumen",
    };
  }

  const localPath = resolveDocumentLocalPath(filePath);

  if (!localPath) {
    return {
      is_hash_match: false,
      current_hash: null,
      blockchain_hash: blockchainHash ?? null,
      message: "Path file PDF tidak valid",
    };
  }

  try {
    const currentHash = await createFileSha256(localPath);

    return {
      is_hash_match: Boolean(blockchainHash && currentHash === blockchainHash),
      current_hash: currentHash,
      blockchain_hash: blockchainHash ?? null,
      message:
        blockchainHash && currentHash === blockchainHash
          ? "Hash PDF sesuai dengan blockchain"
          : "Hash PDF tidak sesuai dengan blockchain",
    };
  } catch (error) {
    return {
      is_hash_match: false,
      current_hash: null,
      blockchain_hash: blockchainHash ?? null,
      message:
        error instanceof Error
          ? `Gagal membaca file PDF: ${error.message}`
          : "Gagal membaca file PDF",
    };
  }
}

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

function buildPublicBlockchainBlock(block: any) {
  if (!block) return null;

  return {
    id_blockchain: block.id_blockchain,
    uuid: block.uuid,
    id_dokumen: block.id_dokumen,
    hash_dokumen: block.hash_dokumen,
    index_block: block.index_block,
    hash_block: block.hash_block,
    previous_hash: block.previous_hash,
    created_at: block.created_at,
  };
}

async function buildBlockchainStatus(dokumen: {
  id_dokumen: number;
  file_pdf?: string | null;
  file_pdf_final?: string | null;
  blockchain?: RawBlockchainBlock;
}) {
  try {
    const result = await verifyDocumentInBlockchain(dokumen.id_dokumen);

    const publicBlock = buildPublicBlockchainBlock(result.block);

    const pdfHash = await buildPdfHashStatus(
      dokumen.file_pdf_final || dokumen.file_pdf || null,
      publicBlock?.hash_dokumen,
    );

    const isChainValid = Boolean(result.valid);
    const isFileHashValid = Boolean(pdfHash.is_hash_match);

    return {
      is_recorded: Boolean(publicBlock),
      is_chain_valid: isChainValid,
      is_file_hash_valid: isFileHashValid,
      message:
        isChainValid && isFileHashValid
          ? "Dokumen valid, rantai blockchain cocok, dan hash PDF sesuai"
          : result.message,
      block: publicBlock,
      pdf_hash: pdfHash,
    };
  } catch (error) {
    const publicBlock = buildPublicBlockchainBlock(dokumen.blockchain);

    const pdfHash = await buildPdfHashStatus(
      dokumen.file_pdf_final || dokumen.file_pdf || null,
      publicBlock?.hash_dokumen,
    );

    return {
      is_recorded: Boolean(publicBlock),
      is_chain_valid: false,
      is_file_hash_valid: Boolean(pdfHash.is_hash_match),
      message: publicBlock
        ? `Dokumen tercatat di blockchain, tetapi gagal verifikasi chain: ${
            error instanceof Error ? error.message : "Fetch gagal"
          }`
        : "Dokumen belum tercatat di blockchain",
      block: publicBlock,
      pdf_hash: pdfHash,
    };
  }
}

export async function verifyDocumentByKodeQr(kodeQr: string) {
  if (!kodeQr || kodeQr.trim() === "") {
    throw new Error("Kode QR wajib diisi");
  }

  const dokumen = await findDokumenByKodeQr(kodeQr);

  if (!dokumen) {
    return {
      is_valid: false,
      message: "Dokumen tidak ditemukan atau QR tidak valid",
      kode_qr: kodeQr,
    };
  }

  const blockchain = await buildBlockchainStatus(dokumen);

  return {
    is_valid: true,
    message:
      blockchain.is_chain_valid && blockchain.is_file_hash_valid
        ? "Dokumen valid, tercatat di blockchain, dan hash PDF sesuai"
        : "Dokumen valid, tetapi status blockchain/hash PDF perlu diperiksa",
    kode_qr: dokumen.kode_qr,
    jenis_dokumen: dokumen.jenis_dokumen,
    nomor_dokumen: dokumen.nomor_dokumen,
    nomor_seri_ijazah: dokumen.mahasiswa?.nomor_seri_ijazah || null,
    tanggal_terbit: dokumen.tanggal_terbit,
    is_verified: dokumen.is_verified,
    url_akses: dokumen.url_akses,

    file_pdf: dokumen.file_pdf,
    file_pdf_final: dokumen.file_pdf_final,
    file_pdf_url: buildPdfUrl(dokumen.file_pdf_final || dokumen.file_pdf),

    mahasiswa: {
      id_mahasiswa: dokumen.mahasiswa?.id_mahasiswa,
      nim: dokumen.mahasiswa?.nim,
      nomor_seri_ijazah: dokumen.mahasiswa?.nomor_seri_ijazah || null,
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

    blockchain,
  };
}