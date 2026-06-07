export type JenisDokumen = "ijazah" | "transkrip";

export type DocumentPageConfig = {
  pdfWidth: number;
  pdfHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  defaultFontSize: number;
};

export function getDocumentPageConfig(
  jenis: JenisDokumen,
  // Dimensi aktual gambar template yang tersimpan di layout.imageWidth/imageHeight
  imageNaturalWidth?: number,
  imageNaturalHeight?: number
): DocumentPageConfig {
  if (jenis === "ijazah") {
    // Ijazah landscape: canvas frontend selalu 780px wide
    const canvasWidth = 780;
    // Hitung canvasHeight dari aspect ratio gambar, fallback ke 552 (rasio A4 landscape)
    const canvasHeight =
      imageNaturalWidth && imageNaturalHeight
        ? Math.round(canvasWidth * (imageNaturalHeight / imageNaturalWidth))
        : 552;

    return {
      pdfWidth: 1100,
      pdfHeight: Math.round(1100 * (canvasHeight / canvasWidth)),
      canvasWidth,
      canvasHeight,
      defaultFontSize: 12,
    };
  }

  // Transkrip portrait: canvas frontend selalu 780px wide
  const canvasWidth = 780;
  // Hitung canvasHeight dari aspect ratio gambar, fallback ke 1224 (rasio gambar default 816x1281)
  const canvasHeight =
    imageNaturalWidth && imageNaturalHeight
      ? Math.round(canvasWidth * (imageNaturalHeight / imageNaturalWidth))
      : 1224;

  return {
    pdfWidth: 780,
    pdfHeight: canvasHeight, // PDF height = canvas height karena scale 1:1
    canvasWidth,
    canvasHeight,
    defaultFontSize: 7,
  };
}
