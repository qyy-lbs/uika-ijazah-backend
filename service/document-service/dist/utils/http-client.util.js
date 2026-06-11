export async function fetchJson(url, options) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options?.headers || {}),
        },
    });
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
//# sourceMappingURL=http-client.util.js.map