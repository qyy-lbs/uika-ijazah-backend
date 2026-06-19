import prisma from "../prisma/prisma.js";

export async function findDocumentById(id_dokumen: number) {
  return prisma.dokumen.findUnique({
    where: {
      id_dokumen,
    },
    include: {
      mahasiswa: {
        select: {
          id_mahasiswa: true,
          uuid: true,
          nim: true,
          nama_mahasiswa: true,
        },
      },
    },
  });
}

export async function findLatestBlock() {
  return prisma.blockchain.findFirst({
    orderBy: {
      index_block: "desc",
    },
  });
}

export async function findBlockByDocumentId(id_dokumen: number) {
  return prisma.blockchain.findUnique({
    where: {
      id_dokumen,
    },
    include: {
      dokumen: {
        include: {
          mahasiswa: {
            select: {
              nim: true,
              nama_mahasiswa: true,
            },
          },
        },
      },
    },
  });
}

export async function findBlockByIndex(index_block: number) {
  return prisma.blockchain.findFirst({
    where: {
      index_block,
    },
  });
}

export async function createBlock(data: {
  id_dokumen: number;
  hash_dokumen: string;
  index_block: number;
  hash_block: string;
  previous_hash: string;
  created_at: Date;
}) {
  return prisma.blockchain.create({
    data,
  });
}

export async function getFullChain() {
  return prisma.blockchain.findMany({
    orderBy: {
      index_block: "asc",
    },
    include: {
      dokumen: {
        include: {
          mahasiswa: {
            select: {
              nim: true,
              nama_mahasiswa: true,
            },
          },
        },
      },
    },
  });
}