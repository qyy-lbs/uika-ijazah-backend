export function generateNomorDokumen(params) {
    const prefix = params.jenis === "ijazah" ? "IJZ" : "TRX";
    const year = new Date().getFullYear();
    return `${prefix}/${params.nim}/${year}`;
}
//# sourceMappingURL=document-number.util.js.map