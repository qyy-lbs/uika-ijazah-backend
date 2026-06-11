import { fetchJson } from "../utils/http-client.util.js";
export async function generateQrForDocument(params) {
    const baseUrl = process.env.QR_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;
    if (!baseUrl) {
        throw new Error("QR_SERVICE_URL belum diatur di document-service");
    }
    if (!internalKey) {
        throw new Error("INTERNAL_SERVICE_KEY belum diatur di document-service");
    }
    const url = `${baseUrl}/api/qr/generate`;
    const result = await fetchJson(url, {
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
//# sourceMappingURL=qr.client.js.map