type ArchiveType = "RJ" | "RV";

export function generateArchiveMarker(type: ArchiveType) {
  const now = new Date();

  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  return `${type}_${yy}${mm}${dd}${hh}${min}`;
}

export function archiveUniqueValue(
  value: string | null | undefined,
  marker: string,
) {
  if (!value) return null;

  if (/_RJ_\d{10}$/.test(value) || /_RV_\d{10}$/.test(value)) {
    return value;
  }

  return `${value}_${marker}`;
}