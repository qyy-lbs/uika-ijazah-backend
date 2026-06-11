/**
 * Generate nomor batch unik: BATCH-YYYYMMDD-XXXX
 */
const FAKULTAS_CODE_MAP: Record<string, string> = {
  "fakultas agama islam": "FAI",
  "fakultas keguruan dan ilmu pendidikan": "FKIP",
  "fakultas ekonomi dan bisnis": "FEB",
  "fakultas teknik dan sains": "FTS",
  "fakultas hukum": "FH",
  "fakultas ilmu kesehatan": "FIKES",
};

export function getSingkatanFakultas(namaFakultas?: string | null) {
  if (!namaFakultas) return "UNKNOWN";

  const normalized = namaFakultas.trim().toLowerCase();

  if (FAKULTAS_CODE_MAP[normalized]) {
    return FAKULTAS_CODE_MAP[normalized];
  }

  return namaFakultas
    .split(" ")
    .filter((word) => {
      const lower = word.toLowerCase();
      return !["fakultas", "dan", "ilmu", "program"].includes(lower);
    })
    .map((word) => word[0]?.toUpperCase())
    .join("")
    .slice(0, 6) || "UNKNOWN";
}

export function generateNomorBatch(params: {
  batchKe: number;
  namaFakultas?: string | null;
}): string {
  const kodeFakultas = getSingkatanFakultas(params.namaFakultas);

  return `Batch-${params.batchKe}-${kodeFakultas}`;
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
