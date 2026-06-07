import crypto from "crypto";
import fs from "fs";

export function generateSha256FromText(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function generateSha256FromFile(filePath: string) {
  const fileBuffer = fs.readFileSync(filePath);

  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

export function generateBlockHash(params: {
  index_block: number;
  id_dokumen: number;
  hash_dokumen: string;
  previous_hash: string | null;
  timestamp: Date;
}) {
  const raw = JSON.stringify({
    index_block: params.index_block,
    id_dokumen: params.id_dokumen,
    hash_dokumen: params.hash_dokumen,
    previous_hash: params.previous_hash,
    timestamp: params.timestamp.toISOString(),
  });

  return generateSha256FromText(raw);
}