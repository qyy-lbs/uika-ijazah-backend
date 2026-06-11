import { fetchJson } from "../utils/http-client.util.js";
export async function getAkademikProfileByNim(nim, mahasiswaCode) {
    const baseUrl = process.env.AKADEMIK_SERVICE_URL;
    if (!baseUrl) {
        throw new Error("AKADEMIK_SERVICE_URL belum diatur");
    }
    const identifier = mahasiswaCode ?? nim;
    const url = `${baseUrl}/api/akademik/profile/${encodeURIComponent(identifier)}`;
    const result = await fetchJson(url);
    return result.data;
}
//# sourceMappingURL=akademik.client.js.map