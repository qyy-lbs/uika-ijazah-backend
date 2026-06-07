import path from "path";
import fs from "fs";

export function resolveDocumentPdfPath(filePdf: string | null | undefined) {
  if (!filePdf) {
    throw new Error("File PDF dokumen tidak tersedia");
  }

  const normalizedPath = filePdf.startsWith("/")
    ? filePdf.slice(1)
    : filePdf;

  const fullPath = path.join(process.cwd(), normalizedPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File PDF tidak ditemukan: ${fullPath}`);
  }

  return fullPath;
}