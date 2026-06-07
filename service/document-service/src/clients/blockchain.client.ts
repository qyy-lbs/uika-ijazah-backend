import { fetchJson } from "../utils/http-client.util.js";

type RecordBlockchainResponse = {
  success: boolean;
  message: string;
  data: {
    already_recorded: boolean;
    blockchain: {
      id_blockchain: number;
      uuid?: string | null;
      id_dokumen: number;
      hash_dokumen: string;
      index_block: number;
      hash_block: string;
      previous_hash: string | null;
      created_at?: string;
    };
  };
};

export async function recordDocumentToBlockchain(params: {
  id_dokumen: number;
}) {
  const baseUrl = process.env.BLOCKCHAIN_SERVICE_URL;
  const internalKey = process.env.INTERNAL_SERVICE_KEY;

  if (!baseUrl) {
    throw new Error("BLOCKCHAIN_SERVICE_URL belum diatur di document-service");
  }

  if (!internalKey) {
    throw new Error("INTERNAL_SERVICE_KEY belum diatur di document-service");
  }

  const result = await fetchJson<RecordBlockchainResponse>(
    `${baseUrl}/api/blockchain/record`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-key": internalKey,
      },
      body: JSON.stringify({
        id_dokumen: params.id_dokumen,
      }),
    }
  );

  return result.data;
}