import { fetchJson } from "../utils/http-client.util.js";

type MineBlockchainResponse = {
  success: boolean;
  message: string;
  data: {
    id_blockchain: number;
    uuid: string | null;
    id_dokumen: number | null;
    hash_dokumen: string | null;
    index_block: number | null;
    hash_block: string | null;
    previous_hash: string | null;
    created_at: string | null;
  };
};

export async function mineDocumentToBlockchain(params: {
  id_dokumen: number;
  hash_dokumen?: string;
}) {
  const baseUrl = process.env.BLOCKCHAIN_SERVICE_URL;
  const internalKey = process.env.INTERNAL_SERVICE_KEY;

  if (!baseUrl) {
    throw new Error("BLOCKCHAIN_SERVICE_URL belum diatur di document-service");
  }

  if (!internalKey) {
    throw new Error("INTERNAL_SERVICE_KEY belum diatur di document-service");
  }

  const url = `${baseUrl}/api/blockchain/internal/mine`;

  const result = await fetchJson<MineBlockchainResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-service-key": internalKey,
    },
    body: JSON.stringify({
  id_dokumen: params.id_dokumen,
  hash_dokumen: params.hash_dokumen,
}),
    
  });

  return {
    message: result.message,
    block: result.data,
  };
}

type VerifyBlockchainResponse = {
  success: boolean;
  data: {
    valid: boolean;
    message: string;
    block: {
      id_blockchain: number;
      uuid: string | null;
      id_dokumen: number | null;
      hash_dokumen: string | null;
      index_block: number | null;
      hash_block: string | null;
      previous_hash: string | null;
      created_at: string | null;
    } | null;
  };
};

export async function verifyDocumentInBlockchain(id_dokumen: number) {
  const baseUrl = process.env.BLOCKCHAIN_SERVICE_URL;

  if (!baseUrl) {
    throw new Error("BLOCKCHAIN_SERVICE_URL belum diatur di document-service");
  }

  const url = `${baseUrl}/api/blockchain/verify/${id_dokumen}`;

  try {
    const result = await fetchJson<VerifyBlockchainResponse>(url, {
      method: "GET",
    });

    return result.data;
  } catch (error) {
    throw new Error(
      `Gagal verifikasi blockchain dokumen ${id_dokumen}: ${
        error instanceof Error ? error.message : "Fetch gagal"
      }`
    );
  }
}