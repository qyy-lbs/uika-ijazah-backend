import type { jenis_dokumen_enum } from "@prisma/client";
import { getAkademikProfileByNim } from "../clients/akademik.client.js";
import { getTemplateForDocument } from "../clients/template.client.js";
import { upsertDokumenByMahasiswaAndJenis } from "../repositories/dokumen.repository.js";
import { generateNomorDokumen } from "../utils/document-number.util.js";
import { getDocumentOutputPath } from "../utils/file-path.util.js";
import { renderDocumentHtml } from "./document-html-renderer.service.js";
import { renderHtmlToPdf } from "./pdf-renderer.service.js";

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

  const profileForRender =
    typeof params.profile === "object" && params.profile !== null
      ? {
          ...(params.profile as Record<string, unknown>),
          dokumen_placeholder: {
            ...((params.profile as any).dokumen_placeholder || {}),
            nomor_dokumen: generateNomorDokumen({
              jenis: params.jenis,
              nim: params.nim,
            }),
            tanggal_terbit: new Date(),
            tanggal_terbit_formatted: new Date().toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            qr_code: null,
            url_akses: publicUrl,
          },
        }
      : params.profile;

  const html = renderDocumentHtml({
    template,
    profile: profileForRender,
  });

  const pageConfig =
  params.jenis === "ijazah"
    ? { width: 1100, height: 780 }
    : { width: 780, height: 1100 };

await renderHtmlToPdf({
  html,
  outputPath: output.absolutePath,
  width: pageConfig.width,
  height: pageConfig.height,
});

  const dokumen = await upsertDokumenByMahasiswaAndJenis({
    id_mahasiswa: params.id_mahasiswa,
    id_template: template.id_template,
    jenis_dokumen: params.jenis as jenis_dokumen_enum,
    nomor_dokumen: generateNomorDokumen({
      jenis: params.jenis,
      nim: params.nim,
    }),
    tanggal_terbit: new Date(),
    file_pdf: output.relativePath,
    file_pdf_final: output.relativePath,
    kode_qr: null,
    url_akses: publicUrl,
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