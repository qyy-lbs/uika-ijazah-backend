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

  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

  const documentBaseUrl =
    process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  const templateBaseUrl =
    process.env.TEMPLATE_PUBLIC_BASE_URL ||
    process.env.TEMPLATE_SERVICE_URL ||
    "http://localhost:3008";

  const akademikBaseUrl =
    process.env.AKADEMIK_PUBLIC_BASE_URL ||
    process.env.AKADEMIK_SERVICE_URL ||
    "http://localhost:3005";

  if (normalizedSrc.startsWith("/uploads/templates")) {
    return `${templateBaseUrl}${normalizedSrc}`;
  }

  if (normalizedSrc.startsWith("/uploads/documents")) {
    return `${documentBaseUrl}${normalizedSrc}`;
  }

  return `${akademikBaseUrl}${normalizedSrc}`;
}