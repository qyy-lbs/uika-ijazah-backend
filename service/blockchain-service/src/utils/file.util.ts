import path from "path";
import fs from "fs";

export function resolveDocumentPdfPath(filePdf: string) {
  const normalizedPath = filePdf.startsWith("/")
    ? filePdf.slice(1)
    : filePdf;

  const documentServiceRoot =
    process.env.DOCUMENT_SERVICE_ROOT || "../document-service";

  const fullPath = path.join(process.cwd(), documentServiceRoot, normalizedPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File PDF tidak ditemukan: ${fullPath}`);
  }

  return fullPath;
}