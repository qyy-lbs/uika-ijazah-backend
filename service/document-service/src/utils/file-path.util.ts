import path from "path";
import fs from "fs";

export function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getDocumentOutputPath(params: {
  jenis: "ijazah" | "transkrip";
  nim: string;
}) {
  const fileName = `${params.jenis}-${params.nim}.pdf`;

  const relativePath = `/uploads/documents/${params.jenis}/${fileName}`;

  const absoluteDir = path.join(
    process.cwd(),
    "uploads",
    "documents",
    params.jenis
  );

  ensureDir(absoluteDir);

  const absolutePath = path.join(absoluteDir, fileName);

  return {
    fileName,
    relativePath,
    absolutePath,
  };
}

export function resolvePublicAssetUrl(src: string | null | undefined) {
  if (!src) return null;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  if (src.startsWith("/")) {
    return `${publicBaseUrl}${src}`;
  }

  return `${publicBaseUrl}/${src}`;
}