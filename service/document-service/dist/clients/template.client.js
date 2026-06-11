import { fetchJson } from "../utils/http-client.util.js";
export async function getTemplateForDocument(jenis) {
    const baseUrl = process.env.TEMPLATE_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;
    if (!baseUrl) {
        throw new Error("TEMPLATE_SERVICE_URL belum diatur");
    }
    if (!internalKey) {
        throw new Error("INTERNAL_SERVICE_KEY belum diatur");
    }
    const url = `${baseUrl}/api/template/internal/${jenis}`;
    const result = await fetchJson(url, {
        headers: {
            "x-internal-service-key": internalKey,
        },
    });
    return result.data;
}
//# sourceMappingURL=template.client.js.map