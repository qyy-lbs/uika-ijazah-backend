import {
  createBlockchainRecord,
  findBlockchainByDokumen,
  findDokumenById,
  getLastBlock,
} from "../repositories/blockchain.repository.js";
import { generateBlockHash, generateSha256FromFile } from "../utils/hash.util.js";
import { resolveDocumentPdfPath } from "../utils/file.util.js";

type RecordBlockchainPayload = {
  id_dokumen: number;
};

export async function recordDocumentToBlockchain(
  payload: RecordBlockchainPayload
) {
  if (!payload.id_dokumen) {
    throw new Error("id_dokumen wajib diisi");
  }

  const dokumen = await findDokumenById(payload.id_dokumen);

  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan");
  }

  const existingBlockchain = await findBlockchainByDokumen(payload.id_dokumen);

  if (existingBlockchain) {
    return {
      already_recorded: true,
      blockchain: existingBlockchain,
    };
  }

  const filePdf = dokumen.file_pdf_final || dokumen.file_pdf;

  if (!filePdf) {
    throw new Error("File PDF dokumen belum tersedia");
  }

  const pdfPath = resolveDocumentPdfPath(filePdf);

  const hashDokumen = generateSha256FromFile(pdfPath);

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
    blockchain,
  };
}