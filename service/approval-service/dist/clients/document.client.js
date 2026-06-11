async function fetchJson(url, options) {
    let response;
    try {
        response = await fetch(url, {
            ...options,
            headers: {
                Accept: "application/json",
                ...(options?.headers || {}),
            },
        });
    }
    catch (error) {
        throw new Error(`Gagal menghubungi document-service: ${url}. ${error instanceof Error ? error.message : "Fetch gagal"}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Response bukan JSON dari ${url}. Status: ${response.status}. Body: ${text}`);
    }
    const result = (await response.json());
    if (!response.ok) {
        const message = typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
            ? result.message
            : `Request gagal ke ${url}`;
        throw new Error(message);
    }
    return result;
}
export async function generateDocumentByNim(nim) {
    const baseUrl = process.env.DOCUMENT_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;
    if (!baseUrl) {
        throw new Error("DOCUMENT_SERVICE_URL belum diatur di approval-service");
    }
    if (!internalKey) {
        throw new Error("INTERNAL_SERVICE_KEY belum diatur di approval-service");
    }
    const url = `${baseUrl}/api/document/internal/generate/${nim}`;
    const result = await fetchJson(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-internal-service-key": internalKey,
        },
    });
    return result.data;
}
//# sourceMappingURL=document.client.js.map