import type { jenis_dokumen_enum } from "@prisma/client";
import { getAkademikProfileByMahasiswaCode } from "../clients/akademik.client.js";
import { getTemplateForDocument } from "../clients/template.client.js";
import { upsertDokumenByMahasiswaAndJenis,findFinalDokumenWithBlockchain } from "../repositories/dokumen.repository.js";
import { generateNomorDokumen } from "../utils/document-number.util.js";
import { getDocumentOutputPath } from "../utils/file-path.util.js";
import { renderDocumentHtml } from "./document-html-renderer.service.js";
import { renderHtmlToPdf } from "./pdf-renderer.service.js";
import { getDocumentPageConfig } from "../utils/document-page-config.util.js";
import { generateQrForDocument } from "../clients/qr.client.js";
import { mineDocumentToBlockchain } from "../clients/blockchain.client.js";
import { createFileSha256 } from "../utils/file-hash.util.js";

function getPublicBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "http://localhost:3009";
}

function getNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function getTemplateElementCount(layout: unknown) {
  if (
    typeof layout === "object" &&
    layout !== null &&
    Array.isArray((layout as { elements?: unknown[] }).elements)
  ) {
    return (layout as { elements: unknown[] }).elements.length;
  }

  return 0;
}

function buildExistingDocumentResponse(
  existing: Awaited<ReturnType<typeof findFinalDokumenWithBlockchain>>,
) {
  if (!existing) {
    return null;
  }

  const relativePath = existing.file_pdf_final || existing.file_pdf || null;

  const { template, blockchain, ...dokumen } = existing;

  return {
    dokumen,
    template: template
      ? {
          id_template: template.id_template,
          jenis_template: template.jenis_template,
          file_template: template.file_template,
          total_elements: getTemplateElementCount(template.konfigurasi_layout),
        }
      : null,
    file: {
      relative_path: relativePath,
      public_url: relativePath ? `${getPublicBaseUrl()}${relativePath}` : null,
    },
    blockchain: {
      message: "Dokumen sudah final dan tercatat di blockchain",
      block: blockchain,
    },
    reused: true,
  };
}

async function generateSingleDocument(params: {
  jenis: "ijazah" | "transkrip";
  id_mahasiswa: number;
  nim: string;
  profile: unknown;
}) {

    const existingFinalDocument = await findFinalDokumenWithBlockchain(
    params.id_mahasiswa,
    params.jenis as jenis_dokumen_enum,
  );

  const existingResponse = buildExistingDocumentResponse(existingFinalDocument);

  if (existingResponse) {
    return existingResponse;
  }
  const template = await getTemplateForDocument(params.jenis);

  const output = getDocumentOutputPath({
    jenis: params.jenis,
    nim: params.nim,
  });

  const publicUrl = `${getPublicBaseUrl()}${output.relativePath}`;

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
    nomor_dokumen: nomorDokumen,
    tanggal_terbit: tanggalTerbit,
    file_pdf: output.relativePath,
    file_pdf_final: output.relativePath,
    kode_qr: qr.kode_qr,
    url_akses: qr.url_akses,
    is_verified: true,
  });

  const hashDokumen = await createFileSha256(output.absolutePath);

const blockchain = await mineDocumentToBlockchain({
  id_dokumen: dokumen.id_dokumen,
  hash_dokumen: hashDokumen,
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
      blockchain,
  reused: false,
  };
}

export async function generateDocumentsByMahasiswaCode(mahasiswaCode: string) {
  const profile = await getAkademikProfileByMahasiswaCode(mahasiswaCode);

  const idMahasiswa = getNumberValue(profile.mahasiswa?.id_mahasiswa);

  if (!idMahasiswa) {
    throw new Error("id_mahasiswa tidak ditemukan dari akademik-service");
  }

  const nim = getStringValue(profile.mahasiswa?.nim);

  if (!nim) {
    throw new Error("NIM tidak ditemukan dari akademik-service");
  }

const ijazah = await generateSingleDocument({
  jenis: "ijazah",
  id_mahasiswa: idMahasiswa,
  nim,
  profile,
});

const transkrip = await generateSingleDocument({
  jenis: "transkrip",
  id_mahasiswa: idMahasiswa,
  nim,
  profile,
});



  return {
    mahasiswa: {
      id_mahasiswa: idMahasiswa,
      mahasiswa_code: profile.mahasiswa?.uuid ?? profile.mahasiswa?.mahasiswa_code,
      nim,
      nama: profile.mahasiswa?.nama,
      nama_mahasiswa: profile.mahasiswa?.nama_mahasiswa,
    },
       generated: {
    ijazah,
    transkrip,
  },
};
  
}

/**
 * Alias sementara supaya final approval lama yang masih menyebut NIM tetap aman.
 * Function ini sekarang bisa menerima NIM ataupun UUID mahasiswa.
 */
export const generateDocumentsByNim = generateDocumentsByMahasiswaCode;
