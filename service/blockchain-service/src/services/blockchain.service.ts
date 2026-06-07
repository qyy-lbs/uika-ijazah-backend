import {
  createBlockchainRecord,
  findBlockchainByDokumen,
  findDokumenById,
  getLastBlock,
  updateBlockchainByDokumen,
} from "../repositories/blockchain.repository.js";
import {
  generateBlockHash,
  generateSha256FromFile,
} from "../utils/hash.util.js";
import { resolveDocumentPdfPath } from "../utils/file.util.js";

type RecordBlockchainPayload = {
  id_dokumen: number;
};

export async function recordDocumentToBlockchain(
  payload: RecordBlockchainPayload,
) {
  if (!payload.id_dokumen) {
    throw new Error("id_dokumen wajib diisi");
  }

  const dokumen = await findDokumenById(payload.id_dokumen);

  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan");
  }

  const filePdf = dokumen.file_pdf_final || dokumen.file_pdf;

  if (!filePdf) {
    throw new Error("File PDF dokumen belum tersedia");
  }

  const pdfPath = resolveDocumentPdfPath(filePdf);

  const hashDokumen = generateSha256FromFile(pdfPath);

  const existingBlockchain = await findBlockchainByDokumen(payload.id_dokumen);

  if (existingBlockchain && existingBlockchain.hash_dokumen === hashDokumen) {
    return {
      already_recorded: true,
      updated: false,
      hash_changed: false,
      blockchain: existingBlockchain,
    };
  }
  if (existingBlockchain && existingBlockchain.hash_dokumen !== hashDokumen) {
    const timestamp = new Date();

    const hashBlock = generateBlockHash({
      index_block: Number(existingBlockchain.index_block),
      id_dokumen: payload.id_dokumen,
      hash_dokumen: hashDokumen,
      previous_hash: existingBlockchain.previous_hash,
      timestamp,
    });

    const updatedBlockchain = await updateBlockchainByDokumen({
      id_dokumen: payload.id_dokumen,
      hash_dokumen: hashDokumen,
      index_block: Number(existingBlockchain.index_block),
      previous_hash: existingBlockchain.previous_hash,
      hash_block: hashBlock,
    });

    return {
      already_recorded: true,
      updated: true,
      hash_changed: true,
      blockchain: updatedBlockchain,
    };
  }

  const lastBlock = await getLastBlock();

  const indexBlock = lastBlock ? Number(lastBlock.index_block) + 1 : 1;

  const previousHash = lastBlock?.hash_block ?? null;

  const timestamp = new Date();

  const hashBlock = generateBlockHash({
    index_block: indexBlock,
    id_dokumen: payload.id_dokumen,
    hash_dokumen: hashDokumen,
    previous_hash: previousHash,
    timestamp,
  });

  const blockchain = await createBlockchainRecord({
    id_dokumen: payload.id_dokumen,
    hash_dokumen: hashDokumen,
    index_block: indexBlock,
    previous_hash: previousHash,
    hash_block: hashBlock,
  });

  return {
    already_recorded: false,
    updated: false,
    hash_changed: false,
    blockchain,
  };
}
