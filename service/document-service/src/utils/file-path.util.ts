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

export function resolvePublicAssetUrl(
  src: string | null | undefined,
  field?: string,
) {
  if (!src) return null;

  let cleanSrc = src.trim();

  if (!cleanSrc) return null;

  if (
    cleanSrc.startsWith("http://") ||
    cleanSrc.startsWith("https://") ||
    cleanSrc.startsWith("data:")
  ) {
    return cleanSrc;
  }

  // Kalau dari database bentuknya "uploads/unit/xxx.png"
  // ubah jadi "/uploads/unit/xxx.png"
  if (cleanSrc.startsWith("uploads/")) {
    cleanSrc = `/${cleanSrc}`;
  }

  const documentBaseUrl =
    process.env.PUBLIC_BASE_URL || "http://localhost:3009";

  const templateBaseUrl =
    process.env.TEMPLATE_PUBLIC_BASE_URL ||
    process.env.TEMPLATE_SERVICE_URL ||
    "http://localhost:3008";

  const masterDataBaseUrl =
    process.env.MASTER_DATA_PUBLIC_BASE_URL ||
    process.env.MASTER_DATA_SERVICE_URL ||
    "http://localhost:3004";

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

  if (cleanSrc.startsWith("/uploads/documents")) {
    return `${documentBaseUrl}${cleanSrc}`;
  }

  // Asset dari master-data-service
  if (
    cleanSrc.startsWith("/uploads/unit") ||
    cleanSrc.startsWith("/uploads/prodi") ||
    cleanSrc.startsWith("/uploads/assets")
  ) {
    return `${masterDataBaseUrl}${cleanSrc}`;
  }

  // Foto mahasiswa dari akademik-service
  if (cleanSrc.startsWith("/uploads/mahasiswa")) {
    return `${akademikBaseUrl}${cleanSrc}`;
  }

  // Fallback semua uploads lain anggap dari master-data
  if (cleanSrc.startsWith("/uploads/")) {
    return `${masterDataBaseUrl}${cleanSrc}`;
  }

  // Kalau DB cuma menyimpan nama file saja, tentukan folder dari field
  if (field === "assets.paraf_kaprodi") {
    return `${masterDataBaseUrl}/uploads/prodi/${cleanSrc}`;
  }

  if (field?.startsWith("assets.")) {
    return `${masterDataBaseUrl}/uploads/unit/${cleanSrc}`;
  }

  if (field === "mahasiswa.foto") {
    return `${akademikBaseUrl}/uploads/mahasiswa/${cleanSrc}`;
  }

  if (field === "dokumen_placeholder.qr_code") {
    return `${qrBaseUrl}/uploads/qr/${cleanSrc}`;
  }

  if (field === "template.file_template") {
    return `${templateBaseUrl}/uploads/templates/${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/")) {
    return `${documentBaseUrl}${cleanSrc}`;
  }

  if (isImageFile(cleanSrc)) {
    return `${masterDataBaseUrl}/uploads/${cleanSrc}`;
  }

  return `${documentBaseUrl}/${cleanSrc}`;
}