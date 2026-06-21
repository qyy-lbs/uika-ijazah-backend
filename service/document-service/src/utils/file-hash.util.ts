import crypto from "crypto";
import fs from "fs/promises";

export async function createFileSha256(filePath: string) {
  const buffer = await fs.readFile(filePath);

  return crypto.createHash("sha256").update(buffer).digest("hex");
}