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

  const documentBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  const templateBaseUrl =
    process.env.TEMPLATE_PUBLIC_BASE_URL ||
    process.env.TEMPLATE_SERVICE_URL ||
    "http://localhost:3008";
    
 if (src.startsWith("/uploads/templates")) {
    return `${templateBaseUrl}${src}`;
  }
  const akademikBaseUrl =
    process.env.AKADEMIK_PUBLIC_BASE_URL ||
    process.env.AKADEMIK_SERVICE_URL ||
    "http://localhost:3005";

  const qrBaseUrl =
    process.env.QR_PUBLIC_BASE_URL ||
    process.env.QR_SERVICE_URL ||
    "http://localhost:3010";

  if (src.startsWith("/uploads/qr")) {
    return `${qrBaseUrl}${src}`;
  }

  if (
    src.startsWith("/uploads/mahasiswa") ||
    src.startsWith("/uploads/unit") ||
    src.startsWith("/uploads/prodi") ||
    src.startsWith("/uploads/assets")
  ) {
    return `${akademikBaseUrl}${src}`;
  }

  if (src.startsWith("/")) {
    return `${documentBaseUrl}${src}`;
  }

  return `${documentBaseUrl}/${src}`;
}