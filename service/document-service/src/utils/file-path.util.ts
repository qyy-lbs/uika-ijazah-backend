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
    params.jenis,
  );

  ensureDir(absoluteDir);

  const absolutePath = path.join(absoluteDir, fileName);

  return {
    fileName,
    relativePath,
    absolutePath,
  };
}

function isImageFile(src: string) {
  return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(src);
}

export function resolvePublicAssetUrl(src: string | null | undefined) {
  if (!src) return null;

  const cleanSrc = src.trim();

  if (!cleanSrc) return null;

  if (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://")) {
    return cleanSrc;
  }

  const documentBaseUrl =
    process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  const templateBaseUrl =
    process.env.TEMPLATE_PUBLIC_BASE_URL ||
    process.env.TEMPLATE_SERVICE_URL ||
    "http://localhost:3008";

  const masterDataBaseUrl =
    process.env.MASTER_DATA_PUBLIC_BASE_URL || "http://localhost:3004";

  const akademikBaseUrl =
    process.env.AKADEMIK_PUBLIC_BASE_URL ||
    process.env.AKADEMIK_SERVICE_URL ||
    "http://localhost:3005";

  const qrBaseUrl =
    process.env.QR_PUBLIC_BASE_URL ||
    process.env.QR_SERVICE_URL ||
    "http://localhost:3010";

  if (cleanSrc.startsWith("/uploads/templates")) {
    return `${templateBaseUrl}${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/uploads/qr")) {
    return `${qrBaseUrl}${cleanSrc}`;
  }

  if (
    cleanSrc.startsWith("/uploads/unit") ||
    cleanSrc.startsWith("/uploads/prodi") ||
    cleanSrc.startsWith("/uploads/assets")
  ) {
    return `${masterDataBaseUrl}${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/uploads/mahasiswa")) {
    return `${akademikBaseUrl}${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/uploads/")) {
    return `${masterDataBaseUrl}${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/")) {
    return `${documentBaseUrl}${cleanSrc}`;
  }

  if (isImageFile(cleanSrc)) {
    return `${masterDataBaseUrl}/uploads/${cleanSrc}`;
  }

  return `${documentBaseUrl}/${cleanSrc}`;
}