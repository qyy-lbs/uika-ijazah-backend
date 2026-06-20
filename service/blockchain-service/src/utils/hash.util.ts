import crypto from "crypto";

export function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createBlockHash(input: {
  index_block: number;
  id_dokumen: number;
  hash_dokumen: string;
  previous_hash: string;
  created_at: string;
}): string {
  return sha256(
    JSON.stringify({
      index_block: input.index_block,
      id_dokumen: input.id_dokumen,
      hash_dokumen: input.hash_dokumen,
      previous_hash: input.previous_hash,
      created_at: input.created_at,
    })
  );
}