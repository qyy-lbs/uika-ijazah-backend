import crypto from "crypto";
import fs from "fs";

export function generateSha256FromFile(filePath: string) {
  const fileBuffer = fs.readFileSync(filePath);

  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}