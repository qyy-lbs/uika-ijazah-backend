export function getValueByPath(data, path) {
    if (!path)
        return null;
    const parts = path.split(".");
    let current = data;
    for (const part of parts) {
        if (current &&
            typeof current === "object" &&
            part in current) {
            current = current[part];
        }
        else {
            return null;
        }
    }
    return current;
}
export function valueToString(value) {
    if (value === null || value === undefined)
        return "";
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string")
        return value;
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return "";
}
//# sourceMappingURL=object-path.util.js.map