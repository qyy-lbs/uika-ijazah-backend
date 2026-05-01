/**
 * Generate nomor batch unik: BATCH-YYYYMMDD-XXXX
 */
export function generateNomorBatch(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BATCH-${datePart}-${randPart}`;
}

/**
 * Parse tanggal dari string format DD/MM/YYYY atau YYYY-MM-DD
 * Return null jika tidak valid
 */
export function parseDate(raw: unknown): Date | null {
  if (!raw) return null;
  const str = String(raw).trim();

  // format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/');
    const d = new Date(`${year}-${month}-${day}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Excel serial number (number)
  const num = Number(raw);
  if (!isNaN(num) && num > 1000) {
    // Excel date serial: days since 1900-01-00
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + num * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}
