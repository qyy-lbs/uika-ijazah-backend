import prisma from "../config/prisma.js";

export async function findDokumenById(id_dokumen: number) {
  return prisma.dokumen.findUnique({
    where: {
      id_dokumen,
    },
  });
}

export async function findBlockchainByDokumen(id_dokumen: number) {
  return prisma.blockchain.findFirst({
    where: {
      id_dokumen,
    },
  });
}

export async function getLastBlock() {
  return prisma.blockchain.findFirst({
    orderBy: {
      index_block: "desc",
    },
  });
}

export async function createBlockchainRecord(params: {
  id_dokumen: number;
  hash_dokumen: string;
  index_block: number;
  previous_hash: string | null;
  hash_block: string;
}) {
  return prisma.blockchain.create({
    data: {
      id_dokumen: params.id_dokumen,
      hash_dokumen: params.hash_dokumen,
      index_block: params.index_block,
      previous_hash: params.previous_hash,
      hash_block: params.hash_block,
    },
  });
}