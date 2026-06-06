export function getValueByPath(data: unknown, path: string | undefined) {
  if (!path) return null;

  const parts = path.split(".");

  let current: unknown = data;

  for (const part of parts) {
    if (
      current &&
      typeof current === "object" &&
      part in current
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return current;
}

export function valueToString(value: unknown) {
  if (value === null || value === undefined) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") return value;

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}