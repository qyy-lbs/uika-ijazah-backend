import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import {
  buildQrImageUrl,
  buildVerifyUrl,
  generateKodeQr,
} from "../utils/qr-code.util.js";

type GenerateQrPayload = {
  nim: string;
  jenis_dokumen: string;
  nomor_dokumen?: string | null;
};

function validateGenerateQrPayload(payload: GenerateQrPayload) {
  if (!payload.nim || payload.nim.trim() === "") {
    throw new Error("NIM wajib diisi");
  }

  if (!payload.jenis_dokumen || payload.jenis_dokumen.trim() === "") {
    throw new Error("Jenis dokumen wajib diisi");
  }

  const jenis = payload.jenis_dokumen.toLowerCase();

  if (jenis !== "ijazah" && jenis !== "transkrip") {
    throw new Error("Jenis dokumen tidak valid. Gunakan ijazah atau transkrip.");
  }
}

export async function generateQrCode(payload: GenerateQrPayload) {
  validateGenerateQrPayload(payload);

  const kodeQr = generateKodeQr({
    nim: payload.nim,
    jenis_dokumen: payload.jenis_dokumen,
  });

  const urlAkses = buildVerifyUrl(kodeQr);

  const fileName = `${kodeQr}.png`;

  const uploadDir = path.join(process.cwd(), "uploads", "qr");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }

  const filePath = path.join(uploadDir, fileName);

  await QRCode.toFile(filePath, urlAkses, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 400,
  });

  const qrImage = `/uploads/qr/${fileName}`;
  const qrImageUrl = buildQrImageUrl(fileName);

  return {
    kode_qr: kodeQr,
    url_akses: urlAkses,
    qr_image: qrImage,
    qr_image_url: qrImageUrl,
    metadata: {
      nim: payload.nim,
      jenis_dokumen: payload.jenis_dokumen.toLowerCase(),
      nomor_dokumen: payload.nomor_dokumen ?? null,
    },
  };
}