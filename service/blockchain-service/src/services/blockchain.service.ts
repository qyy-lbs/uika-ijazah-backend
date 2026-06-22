import fs from "fs/promises";
import path from "path";
import {
  createBlock,
  findBlockByDocumentId,
  findDocumentById,
  findLatestBlock,
  getFullChain,
} from "../repositories/blockchain.repository.js";
import { createBlockHash, sha256 } from "../utils/hash.util.js";

function createMetadataHash(dokumen: NonNullable<Awaited<ReturnType<typeof findDocumentById>>>) {
  return sha256(
    JSON.stringify({
      id_dokumen: dokumen.id_dokumen,
      uuid: dokumen.uuid,
      id_mahasiswa: dokumen.id_mahasiswa,
      jenis_dokumen: dokumen.jenis_dokumen,
      nomor_dokumen: dokumen.nomor_dokumen,
      tanggal_terbit: dokumen.tanggal_terbit,
      file_pdf: dokumen.file_pdf,
      file_pdf_final: dokumen.file_pdf_final,
      kode_qr: dokumen.kode_qr,
      url_akses: dokumen.url_akses,
      mahasiswa: dokumen.mahasiswa,
    })
  );
}

function resolveDocumentFilePath(filePath?: string | null) {
  if (!filePath || !process.env.DOCUMENT_UPLOAD_DIR) {
    return null;
  }

  const normalized = filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\/documents\/?/, "");

  return path.join(process.env.DOCUMENT_UPLOAD_DIR, normalized);
}

async function createDocumentHash(
  dokumen: NonNullable<Awaited<ReturnType<typeof findDocumentById>>>,
  hashFromCaller?: string
) {
  if (hashFromCaller) {
    return hashFromCaller;
  }

  const finalFile = dokumen.file_pdf_final || dokumen.file_pdf;
  const resolvedPath = resolveDocumentFilePath(finalFile);

  if (resolvedPath) {
    try {
      const buffer = await fs.readFile(resolvedPath);
      return sha256(buffer);
    } catch {
      // Kalau file belum bisa dibaca, fallback ke metadata dokumen
    }
  }

  return createMetadataHash(dokumen);
}

export async function mineDocumentBlock(input: {
  id_dokumen: number;
  hash_dokumen?: string;
}) {
  const id_dokumen = input.id_dokumen;

  const existingBlock = await findBlockByDocumentId(id_dokumen);

  if (existingBlock) {
    return {
      already_exists: true,
      block: existingBlock,
    };
  }

  const dokumen = await findDocumentById(id_dokumen);

  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan");
  }

  const latestBlock = await findLatestBlock();

  const indexBlock = (latestBlock?.index_block || 0) + 1;
  const previousHash = latestBlock?.hash_block || "GENESIS";
  const createdAt = new Date();

    const hashDokumen = input.hash_dokumen || (await createDocumentHash(dokumen));
    const hashBlock = createBlockHash({
    index_block: indexBlock,
    id_dokumen,
    hash_dokumen: hashDokumen,
    previous_hash: previousHash,
    created_at: createdAt.toISOString(),
  });

  const block = await createBlock({
    id_dokumen,
    hash_dokumen: hashDokumen,
    index_block: indexBlock,
    hash_block: hashBlock,
    previous_hash: previousHash,
    created_at: createdAt,
  });

  return {
    already_exists: false,
    block,
  };
}

export async function verifyDocumentBlock(id_dokumen: number) {
  const block = await findBlockByDocumentId(id_dokumen);

  if (!block) {
    return {
      valid: false,
      message: "Dokumen belum tercatat di blockchain",
      block: null,
      full_chain: null,
    };
  }

  if (
    block.index_block == null ||
    block.id_dokumen == null ||
    !block.hash_block ||
    !block.hash_dokumen ||
    !block.previous_hash
  ) {
    return {
      valid: false,
      message: "Data block tidak lengkap",
      block,
      full_chain: null,
    };
  }

  /**
   * Setiap verify dokumen wajib mengecek full chain.
   * Jadi kalau index 5 rusak,
   * dokumen di index 25 juga ikut tidak valid.
   */
  const fullChainStatus = await verifyFullChain();

  const recalculatedHash = createBlockHash({
    index_block: block.index_block,

    // Pakai parameter id_dokumen agar TypeScript tidak error nullable.
    id_dokumen,

    hash_dokumen: block.hash_dokumen,
    previous_hash: block.previous_hash,
    created_at: block.created_at?.toISOString() || "",
  });

  const isCurrentBlockHashValid = recalculatedHash === block.hash_block;

  if (!isCurrentBlockHashValid) {
    return {
      valid: false,
      message: "Hash block dokumen tidak cocok",
      block,
      full_chain: fullChainStatus,
    };
  }

  if (!fullChainStatus.valid) {
    return {
      valid: false,
      message: `Rantai blockchain tidak valid: ${fullChainStatus.message}`,
      block,
      full_chain: fullChainStatus,
    };
  }

  return {
    valid: true,
    message: "Dokumen valid dan seluruh rantai blockchain cocok",
    block,
    full_chain: fullChainStatus,
  };
}

export async function verifyFullChain() {
  const chain = await getFullChain();

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];

    if (
      current.index_block == null ||
      current.id_dokumen == null ||
      !current.hash_dokumen ||
      !current.hash_block ||
      !current.previous_hash
    ) {
      return {
        valid: false,
        message: `Block index ${current.index_block} tidak lengkap`,
        broken_at: current,
        total_block: chain.length,
      };
    }

    const expectedIndex = i + 1;

    if (current.index_block !== expectedIndex) {
      return {
        valid: false,
        message: `Index block tidak berurutan. Seharusnya ${expectedIndex}, tetapi ditemukan ${current.index_block}`,
        broken_at: current,
        total_block: chain.length,
      };
    }

    const expectedPreviousHash = i === 0 ? "GENESIS" : chain[i - 1].hash_block;

    if (current.previous_hash !== expectedPreviousHash) {
      return {
        valid: false,
        message: `Previous hash rusak di block index ${current.index_block}`,
        broken_at: current,
        total_block: chain.length,
      };
    }

    const recalculatedHash = createBlockHash({
      index_block: current.index_block,
      id_dokumen: current.id_dokumen,
      hash_dokumen: current.hash_dokumen,
      previous_hash: current.previous_hash,
      created_at: current.created_at?.toISOString() || "",
    });

    if (recalculatedHash !== current.hash_block) {
      return {
        valid: false,
        message: `Hash block rusak di block index ${current.index_block}`,
        broken_at: current,
        total_block: chain.length,
      };
    }
  }

  return {
    valid: true,
    message: "Semua rantai blockchain valid",
    total_block: chain.length,
    broken_at: null,
  };
}

export async function getBlockchainChain() {
  return getFullChain();
}

export async function getBlockchainByDocument(id_dokumen: number) {
  return findBlockByDocumentId(id_dokumen);
}