import { fetchJson } from "../utils/http-client.util.js";

type GenerateQrResponse = {
  success: boolean;
  message: string;
  data: {
    kode_qr: string;
    url_akses: string;
    qr_image: string;
    qr_image_url: string;
    metadata: {
      nim: string;
      jenis_dokumen: string;
      nomor_dokumen: string | null;
    };
  };
};

export async function generateQrForDocument(params: {
  nim: string;
  jenis_dokumen: "ijazah" | "transkrip";
  nomor_dokumen: string | null;
}) {
  const baseUrl = process.env.QR_SERVICE_URL;
  const internalKey = process.env.INTERNAL_SERVICE_KEY;

  if (!baseUrl) {
    throw new Error("QR_SERVICE_URL belum diatur di document-service");
  }

  if (!internalKey) {
    throw new Error("INTERNAL_SERVICE_KEY belum diatur di document-service");
  }

  const url = `${baseUrl}/api/qr/generate`;

  const result = await fetchJson<GenerateQrResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-service-key": internalKey,
    },
    body: JSON.stringify({
      nim: params.nim,
      jenis_dokumen: params.jenis_dokumen,
      nomor_dokumen: params.nomor_dokumen,
    }),
  });

  return result.data;
}