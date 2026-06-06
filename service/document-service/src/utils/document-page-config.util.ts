export type JenisDokumen = "ijazah" | "transkrip";

export type DocumentPageConfig = {
  pdfWidth: number;
  pdfHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  defaultFontSize: number;
};

export function getDocumentPageConfig(jenis: JenisDokumen): DocumentPageConfig {
  if (jenis === "ijazah") {
    return {
      // PDF landscape
      pdfWidth: 1100,
      pdfHeight: 780,

      // ukuran preview frontend ijazah: img w-[780px]
      // landscape ratio kira-kira 780 x 552
      canvasWidth: 780,
      canvasHeight: 552,

      defaultFontSize: 14,
    };
  }

  return {
    // PDF portrait
    pdfWidth: 780,
    pdfHeight: 1100,

    // ukuran preview frontend transkrip
    canvasWidth: 780,
    canvasHeight: 1100,

    defaultFontSize: 7,
  };
}