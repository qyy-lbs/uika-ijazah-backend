import type { jenis_dokumen_enum } from "@prisma/client";
import { getAkademikProfileByNim } from "../clients/akademik.client.js";
import { getTemplateForDocument } from "../clients/template.client.js";
import { upsertDokumenByMahasiswaAndJenis } from "../repositories/dokumen.repository.js";
import { generateNomorDokumen } from "../utils/document-number.util.js";
import { getDocumentOutputPath } from "../utils/file-path.util.js";
import { renderDocumentHtml } from "./document-html-renderer.service.js";
import { renderHtmlToPdf } from "./pdf-renderer.service.js";
import { getDocumentPageConfig } from "../utils/document-page-config.util.js";
import { generateQrForDocument } from "../clients/qr.client.js";

function getPublicBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "http://localhost:3009";
}

async function generateSingleDocument(params: {
  jenis: "ijazah" | "transkrip";
  id_mahasiswa: number;
  nim: string;
  profile: unknown;
}) {
  const template = await getTemplateForDocument(params.jenis);

  const output = getDocumentOutputPath({
    jenis: params.jenis,
    nim: params.nim,
  });

  const publicUrl = `${getPublicBaseUrl()}${output.relativePath}`;

  // Fix Bug 2: generate sekali, pakai ulang di dua tempat
  const nomorDokumen = generateNomorDokumen({
    jenis: params.jenis,
    nim: params.nim,
  });
  const qr = await generateQrForDocument({
    nim: params.nim,
    jenis_dokumen: params.jenis,
    nomor_dokumen: nomorDokumen,
  });
  const tanggalTerbit = new Date();
  const tanggalTerbitFormatted = tanggalTerbit.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const profileForRender =
    typeof params.profile === "object" && params.profile !== null
      ? {
          ...(params.profile as Record<string, unknown>),
          dokumen_placeholder: {
            ...((params.profile as any).dokumen_placeholder || {}),
            nomor_dokumen: nomorDokumen,
            tanggal_terbit: tanggalTerbit,
            tanggal_terbit_formatted: tanggalTerbitFormatted,

            // Pakai relative path supaya resolvePublicAssetUrl mengarah ke qr-service internal
            qr_code: qr.qr_image,

            kode_qr: qr.kode_qr,
            url_akses: qr.url_akses,
            file_pdf_url: publicUrl,
          },
        }
      : params.profile;

  const html = renderDocumentHtml({
    template,
    profile: profileForRender,
  });

  // Fix Bug 1: pakai dimensi gambar dari layout yang sama dengan renderer
  const layout = template.konfigurasi_layout;
  const pageConfig = getDocumentPageConfig(
    params.jenis,
    layout.imageNaturalWidth ?? undefined,
    layout.imageNaturalHeight ?? undefined,
  );

  await renderHtmlToPdf({
    html,
    outputPath: output.absolutePath,
    width: pageConfig.pdfWidth,
    height: pageConfig.pdfHeight,
  });

  const dokumen = await upsertDokumenByMahasiswaAndJenis({
    id_mahasiswa: params.id_mahasiswa,
    id_template: template.id_template,
    jenis_dokumen: params.jenis as jenis_dokumen_enum,
    nomor_dokumen: nomorDokumen, // Fix Bug 2: pakai yang sama
    tanggal_terbit: tanggalTerbit, // Fix Bug 2: pakai yang sama
    file_pdf: output.relativePath,
    file_pdf_final: output.relativePath,
    kode_qr: qr.kode_qr,
    url_akses: qr.url_akses,
    is_verified: false,
  });

  return {
    dokumen,
    template: {
      id_template: template.id_template,
      jenis_template: template.jenis_template,
      file_template: template.file_template,
      total_elements: template.konfigurasi_layout.elements.length,
    },
    file: {
      relative_path: output.relativePath,
      public_url: publicUrl,
    },
  };
}

export async function generateDocumentsByNim(nim: string) {
  const profile = await getAkademikProfileByNim(nim);

  const idMahasiswaRaw = profile.mahasiswa?.id_mahasiswa;

  if (typeof idMahasiswaRaw !== "number") {
    throw new Error("id_mahasiswa tidak ditemukan dari akademik-service");
  }

  const [ijazah, transkrip] = await Promise.all([
    generateSingleDocument({
      jenis: "ijazah",
      id_mahasiswa: idMahasiswaRaw,
      nim,
      profile,
    }),
    generateSingleDocument({
      jenis: "transkrip",
      id_mahasiswa: idMahasiswaRaw,
      nim,
      profile,
    }),
  ]);

  return {
    mahasiswa: {
      id_mahasiswa: idMahasiswaRaw,
      nim: profile.mahasiswa?.nim,
      nama: profile.mahasiswa?.nama,
    },
    generated: {
      ijazah,
      transkrip,
    },
  };
}
