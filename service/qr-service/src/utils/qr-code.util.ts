import crypto from "crypto";

function normalizeJenisDokumen(jenis: string) {
  const normalized = jenis.toLowerCase();

  if (normalized !== "ijazah" && normalized !== "transkrip") {
    throw new Error("Jenis dokumen tidak valid. Gunakan ijazah atau transkrip.");
  }

  return normalized;
}

export function generateKodeQr(data: {
  nim: string;
  jenis_dokumen: string;
}) {
  const jenis = normalizeJenisDokumen(data.jenis_dokumen).toUpperCase();

  const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `QR-${jenis}-${data.nim}-${randomCode}`;
}

export function buildVerifyUrl(kodeQr: string) {
  const verifyBaseUrl = process.env.VERIFY_BASE_URL || "http://localhost:5173/verify";

  return `${verifyBaseUrl}/${kodeQr}`;
}

export function buildQrImageUrl(fileName: string) {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3010";

  return `${publicBaseUrl}/uploads/qr/${fileName}`;
}