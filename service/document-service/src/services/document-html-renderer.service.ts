import type {
  TemplateDocument,
  TemplateElement,
} from "../clients/template.client.js";
import { getValueByPath, valueToString } from "../utils/object-path.util.js";
import { resolvePublicAssetUrl } from "../utils/file-path.util.js";
import { getDocumentPageConfig } from "../utils/document-page-config.util.js";
import { normalizeTemplateElement } from "../utils/template-field-map.util.js";

const KUALIFIKASI_NILAI = [
  ["A", "4.0", "Sangat Baik Sekali"],
  ["AB", "3.5", "Sangat Baik"],
  ["B", "3.0", "Baik"],
  ["BC", "2.5", "Lebih dari Cukup"],
  ["C", "2.0", "Cukup"],
  ["CD", "1.5", "Kurang dari Cukup"],
  ["D", "1.0", "Kurang"],
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTextAlign(element: TemplateElement) {
  if (element.align === "left") return "left";
  if (element.align === "right") return "right";

  return "center";
}

function getTextJustify(element: TemplateElement) {
  if (element.align === "left") return "flex-start";
  if (element.align === "right") return "flex-end";

  return "center";
}

function getFontFamily(element: TemplateElement) {
  return typeof element.fontFamily === "string" && element.fontFamily.trim()
    ? element.fontFamily
    : "Times New Roman";
}

function getFontWeight(element: TemplateElement, fallback = "400") {
  return typeof element.fontWeight === "string" && element.fontWeight.trim()
    ? element.fontWeight
    : fallback;
}

function getFontSize(element: TemplateElement, fallback: number) {
  const fontSize = Number(element.fontSize ?? fallback);

  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize : fallback;
}

function getFontStyle(element: TemplateElement, fallback = "normal") {
  return element.fontStyle === "italic" ? "italic" : fallback;
}

function getTextDecoration(element: TemplateElement, fallback = "none") {
  return element.textDecoration === "underline" ? "underline" : fallback;
}

function renderTextElement(
  element: TemplateElement,
  profile: unknown,
  scaleX: number,
  scaleY: number,
  defaultFontSize: number,
) {
  let value = valueToString(
  getValueByPath(profile, element.field)
);

if (element.label === "Gelar") {
  const gelar = valueToString(
    getValueByPath(profile, "mahasiswa.gelar")
  );

  const gelarEn = valueToString(
    getValueByPath(profile, "mahasiswa.gelar_en")
  );

  value = [gelar, gelarEn]
    .filter(Boolean)
    .join(" / ");
}

  console.log("RENDER TEXT:", {
    label: element.label,
    field: element.field,
    value,
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    textDecoration: element.textDecoration,
    align: element.align,
  });

  let finalValue = value || "";

  if (
  element.label === "NIDN Rektor" ||
  element.label === "NIDN Dekan")
     {
      finalValue = `NIDN. ${finalValue}`;
      }

  const safeValue = escapeHtml(finalValue);

  const left = (element.x ?? 0) * scaleX;
  const top = (element.y ?? 0) * scaleY;
  const width = (element.width ?? 120) * scaleX;
  const height = (element.height ?? 24) * scaleY;

  const baseFontSize = getFontSize(element, defaultFontSize);
  const fontScale = Math.min(scaleX, scaleY);
  const fontSize = baseFontSize * fontScale;
  const fontFamily = getFontFamily(element);
  const fontWeight = getFontWeight(element, "600");
  const fontStyle = getFontStyle(element);
  const textDecoration = getTextDecoration(element);
  const align = getTextAlign(element);
  const justify = getTextJustify(element);

  return `
    <div
      class="element text-element"
      style="
        left:${left}px;
        top:${top}px;
        width:${width}px;
        height:${height}px;
        font-size:${fontSize}px;
        font-family:${fontFamily};
        font-weight:${fontWeight};
        text-decoration:${textDecoration};
        text-align:${align};
        font-style:${fontStyle};  
        justify-content:${justify};
      "
    >
      ${safeValue}
    </div>
  `;
}

function renderImageElement(
  element: TemplateElement,
  profile: unknown,
  scaleX: number,
  scaleY: number,
) {
  const rawValue = valueToString(getValueByPath(profile, element.field));
  const imageUrl = resolvePublicAssetUrl(rawValue);

  const left = (element.x ?? 0) * scaleX;
  const top = (element.y ?? 0) * scaleY;
  const width = (element.width ?? 80) * scaleX;
  const height = (element.height ?? 80) * scaleY;

  if (!imageUrl) {
    return `
      <div
        class="element empty-image"
        style="
          left:${left}px;
          top:${top}px;
          width:${width}px;
          height:${height}px;
        "
      ></div>
    `;
  }

  return `
    <img
      class="element image-element"
      src="${imageUrl}"
      style="
        left:${left}px;
        top:${top}px;
        width:${width}px;
        height:${height}px;
        object-fit:contain;
      "
    />
  `;
}

function renderSignatureElement(
  element: TemplateElement,
  profile: unknown,
  scaleX: number,
  scaleY: number,
) {
  const rawValue = valueToString(getValueByPath(profile, element.field));
  const imageUrl = resolvePublicAssetUrl(rawValue);

  const left = (element.x ?? 0) * scaleX;
  const top = (element.y ?? 0) * scaleY;
  const width = (element.width ?? 90) * scaleX;
  const height = (element.height ?? 70) * scaleY;

  const roleLabel =
    typeof element.roleLabel === "string" && element.roleLabel.trim()
      ? element.roleLabel
      : "Dekan,";

  const fontSize = getFontSize(element, 8);
  const fontFamily = getFontFamily(element);
  const fontWeight = getFontWeight(element, "600");
  const align = getTextAlign(element);

  return `
    <div
      class="element signature-element"
      style="
        left:${left}px;
        top:${top}px;
        width:${width}px;
        height:${height}px;
        font-size:${fontSize}px;
        font-family:${fontFamily};
        font-weight:${fontWeight};
        text-align:${align};
      "
    >
      <div class="signature-role">${escapeHtml(roleLabel)}</div>

      ${
        imageUrl
          ? `<img class="signature-image" src="${imageUrl}" />`
          : `<div class="signature-placeholder"></div>`
      }
    </div>
  `;
}

function renderQrElement(
  element: TemplateElement,
  profile: unknown,
  scaleX: number,
  scaleY: number
) {
  const rawValue = valueToString(getValueByPath(profile, element.field));
  const qrUrl = resolvePublicAssetUrl(rawValue);

  const left = (element.x ?? 0) * scaleX;
  const top = (element.y ?? 0) * scaleY;
  const width = (element.width ?? 72) * scaleX;
  const height = (element.height ?? 72) * scaleY;

  if (!qrUrl) {
    return `
      <div
        class="element qr-element"
        style="
          left:${left}px;
          top:${top}px;
          width:${width}px;
          height:${height}px;
        "
      >
        QR
      </div>
    `;
  }

  return `
    <img
      class="element qr-image-element"
      src="${qrUrl}"
      style="
        left:${left}px;
        top:${top}px;
        width:${width}px;
        height:${height}px;
        object-fit:contain;
        display:block;
      "
    />
  `;
}

function renderTranskripTable(
  element: TemplateElement,
  profile: any,
  scaleX: number,
  scaleY: number,
) {
  const rows = Array.isArray(profile?.transkrip) ? profile.transkrip : [];

  const normalizedRows =
    rows.length > 0
      ? rows
      : Array.from({ length: 40 }).map((_, index) => ({
          no: index + 1,
          kode: "",
          nama: "",
          hm: "",
          am: "",
          k: "",
          t: "",
        }));

  const splitIndex = Math.ceil(normalizedRows.length / 2);
  const leftRows = normalizedRows.slice(0, splitIndex);
  const rightRows = normalizedRows.slice(splitIndex);

  const left = (element.x ?? 0) * scaleX;
  const top = (element.y ?? 0) * scaleY;
  const width = (element.width ?? 700) * scaleX;

  const fontSize = getFontSize(element, 7);
  const fontFamily = getFontFamily(element);
  const fontWeight = getFontWeight(element, "500");

  const totalSks = profile?.akademik?.total_sks ?? "";
  const ipk = profile?.akademik?.ipk ?? "";
  const predikat = profile?.akademik?.predikat ?? "";
  const judulSkripsi = profile?.mahasiswa?.judul_skripsi ?? "";

  const renderRows = (list: any[]) =>
    list
      .map((item: any, index: number) => {
        return `
          <tr>
            <td class="text-center">${escapeHtml(
              String(item.no ?? index + 1),
            )}</td>
            <td class="text-center">${escapeHtml(String(item.kode ?? ""))}</td>
            <td class="mk-name">${escapeHtml(
              String(item.nama ?? item.mata_kuliah ?? ""),
            )}</td>
            <td class="text-center">${escapeHtml(String(item.hm ?? ""))}</td>
            <td class="text-center">${escapeHtml(String(item.am ?? ""))}</td>
            <td class="text-center">${escapeHtml(String(item.k ?? ""))}</td>
            <td class="text-center">${escapeHtml(String(item.t ?? ""))}</td>
          </tr>
        `;
      })
      .join("");

  const renderTable = (list: any[], withFooter: boolean) => `
    <table class="nilai-table">
      <thead>
        <tr>
          <th class="col-no">NO</th>
          <th class="col-kode">KODE</th>
          <th>MATA KULIAH</th>
          <th colspan="2">NILAI</th>
          <th colspan="2">BOBOT</th>
        </tr>

        <tr>
          <th></th>
          <th></th>
          <th></th>
          <th class="col-small">HM</th>
          <th class="col-small">AM</th>
          <th class="col-small">K</th>
          <th class="col-small">T</th>
        </tr>
      </thead>

      <tbody>
        ${renderRows(list)}

        ${
          withFooter
            ? `
              <tr>
                <td></td>
                <td></td>
                <td class="mk-name footer-label">Jumlah</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-center footer-label">${escapeHtml(
                  String(totalSks),
                )}</td>
              </tr>

              <tr>
                <td></td>
                <td></td>
                <td colspan="5" class="footer-label">
                  Indeks Prestasi Kumulatif
                  <span class="footer-value">${escapeHtml(String(ipk))}</span>
                </td>
              </tr>

              <tr>
                <td></td>
                <td></td>
                <td colspan="5" class="footer-label">
                  Predikat Kelulusan
                  <span class="footer-value">${escapeHtml(
                    String(predikat),
                  )}</span>
                </td>
              </tr>

              <tr>
                <td></td>
                <td></td>
                <td colspan="5" class="footer-label">
                  Judul Skripsi : ${escapeHtml(String(judulSkripsi))}
                </td>
              </tr>
            `
            : ""
        }
      </tbody>
    </table>
  `;

  const qualificationRows = KUALIFIKASI_NILAI.map(
    ([huruf, angka, kualifikasi]) => `
      <tr>
        <td class="text-center bold">${escapeHtml(huruf)}</td>
        <td class="text-center bold">${escapeHtml(angka)}</td>
        <td class="qualification-text bold">${escapeHtml(kualifikasi)}</td>
      </tr>
    `,
  ).join("");

  return `
    <div
      class="element transkrip-table-block"
      style="
        left:${left}px;
        top:${top}px;
        width:${width}px;
        font-size:${fontSize}px;
        font-family:${fontFamily};
        font-weight:${fontWeight};
      "
    >
      <div class="nilai-grid">
        <div>${renderTable(leftRows, false)}</div>
        <div>${renderTable(rightRows, true)}</div>
      </div>

      <div class="under-table-row">
        <div class="qualification-section">
          <div class="note-section">
            <div class="bold">Keterangan</div>
            <div>+ Mata Kuliah Konversi</div>
            <div>++ Mata Kuliah Konsentrasi</div>
            <div>+++ Mata Kuliah MBKM</div>
          </div>

          <div class="qualification-title bold">Kualifikasi Nilai</div>

          <table class="qualification-table">
            <thead>
              <tr>
                <th colspan="2">Nilai</th>
                <th>Kualifikasi</th>
              </tr>

              <tr>
                <th class="qual-small">Huruf</th>
                <th class="qual-small">Angka</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              ${qualificationRows}
            </tbody>
          </table>
        </div>

        <div class="qualification-right-space"></div>
      </div>
    </div>
  `;
}

function renderElement(
  element: TemplateElement,
  profile: unknown,
  scaleX: number,
  scaleY: number,
  defaultFontSize: number,
) {
  if (element.type === "signature") {
    return renderSignatureElement(element, profile, scaleX, scaleY);
  }

  if (element.type === "image") {
    return renderImageElement(element, profile, scaleX, scaleY);
  }

  if (element.type === "qr") {
  return renderQrElement(element, profile, scaleX, scaleY);
  }
  

  if (element.type === "table") {
    return renderTranskripTable(element, profile, scaleX, scaleY);
  }

  return renderTextElement(element, profile, scaleX, scaleY, defaultFontSize);
}

export function renderDocumentHtml(params: {
  template: TemplateDocument;
  profile: unknown;
}) {
  const jenis = params.template.jenis_template;
  const layout = params.template.konfigurasi_layout;

  const pageConfig = getDocumentPageConfig(
    jenis,
    layout.imageNaturalWidth,
    layout.imageNaturalHeight,
  );

  const scaleX = pageConfig.pdfWidth / pageConfig.canvasWidth;
  const scaleY = pageConfig.pdfHeight / pageConfig.canvasHeight;

  console.log("DOCUMENT RENDER CONFIG:", {
    jenis,
    imageNaturalWidth: layout.imageNaturalWidth,
    imageNaturalHeight: layout.imageNaturalHeight,
    pageConfig,
    scaleX,
    scaleY,
  });

  const backgroundUrl = resolvePublicAssetUrl(params.template.file_template);

  const elements = params.template.konfigurasi_layout.elements || [];

  const renderedElements = elements
    .map((element) =>
      renderElement(
        normalizeTemplateElement(element, jenis),
        params.profile,
        scaleX,
        scaleY,
        pageConfig.defaultFontSize,
      ),
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: "Times New Roman", Arial, sans-serif;
          }

          .page {
            position: relative;
            width: ${pageConfig.pdfWidth}px;
            height: ${pageConfig.pdfHeight}px;
            background: #ffffff;
            overflow: hidden;
          }

          .background {
            position: absolute;
            left: 0;
            top: 0;
            width: ${pageConfig.pdfWidth}px;
            height: ${pageConfig.pdfHeight}px;
            object-fit: fill;
            z-index: 1;
          }

          .element {
            position: absolute;
            z-index: 10;
          }

          .text-element {
            display: flex;
            align-items: center;
            color: #111827;
            line-height: 1.1;
            overflow: visible;
            white-space: nowrap;
          }

          .image-element {
            display: block;
          }

          .empty-image {
            border: 1px solid transparent;
          }

          .qr-element {
            border: 1px solid #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
          }

          .signature-element {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            color: #111827;
          }

          .signature-role {
            margin-bottom: 4px;
          }

          .signature-image {
            width: 80%;
            height: 65%;
            object-fit: contain;
          }

          .signature-placeholder {
            width: 80%;
            height: 65%;
            border: 1px solid transparent;
          }

          .transkrip-table-block {
            color: #111827;
          }

          .nilai-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .nilai-table {
            width: 100%;
            border-collapse: collapse;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
          }

          .nilai-table th,
          .nilai-table td {
            border: 1px solid #444;
            padding: 2px 3px;
            line-height: 1.1;
          }

          .col-no {
            width: 24px;
          }

          .col-kode {
            width: 52px;
          }

          .col-small {
            width: 28px;
          }

          .text-center {
            text-align: center;
          }

          .mk-name {
            text-align: left;
          }

          .footer-label {
            font-weight: 700;
          }

          .footer-value {
            float: right;
            font-weight: 700;
          }

          .under-table-row {
            margin-top: 10px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }

          .qualification-section {
            width: 250px;
          }

          .note-section {
            font-size: inherit;
            line-height: 1.35;
            margin-bottom: 6px;
          }

          .qualification-title {
            font-size: inherit;
            margin-bottom: 3px;
          }

          .qualification-table {
            width: 100%;
            border-collapse: collapse;
            font-size: inherit;
            font-family: inherit;
            font-weight: inherit;
          }

          .qualification-table th,
          .qualification-table td {
            border: 1px solid #444;
            padding: 2px 4px;
            line-height: 1.1;
          }

          .qual-small {
            width: 36px;
          }

          .qualification-text {
            text-align: left;
          }

          .qualification-right-space {
            flex: 1;
          }

          .bold {
            font-weight: 700;
          }
        </style>
      </head>

      <body>
        <div class="page">
          ${
            backgroundUrl
              ? `<img class="background" src="${backgroundUrl}" />`
              : ""
          }

          ${renderedElements}
        </div>
      </body>
    </html>
  `;
}
