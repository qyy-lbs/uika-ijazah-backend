export function generateNomorDokumen(params: {
  jenis: "ijazah" | "transkrip";
  nim: string;
}) {
  const prefix = params.jenis === "ijazah" ? "IJZ" : "TRX";
  const year = new Date().getFullYear();

  return `${prefix}/${params.nim}/${year}`;
}