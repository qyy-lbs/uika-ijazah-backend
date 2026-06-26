import fs from "fs";
import path from "path";
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import prisma from "../prisma/prisma.js";
import { sendStudentDocumentEmail } from "./mail.service.js";

const VIEWER_ROLES = [
  "admin",
  "admin_sistem",
  "operator",
  "operator_data",
  "rektor",
];

const DOWNLOADER_ROLES = ["admin", "admin_sistem", "operator", "operator_data"];

function normalizeRole(role?: string) {
  return String(role || "")
    .toLowerCase()
    .trim();
}

function isAllowedViewer(role?: string) {
  return VIEWER_ROLES.includes(normalizeRole(role));
}

function isAllowedDownloader(role?: string) {
  return DOWNLOADER_ROLES.includes(normalizeRole(role));
}
type StudentDownloadTokenPayload = {
  purpose: "student-download";
  id_dokumen: number;
  id_mahasiswa: number;
  jenis_dokumen: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur");
  }

  return secret;
}

function getPublicGatewayUrl() {
  return process.env.PUBLIC_GATEWAY_URL || "http://localhost:8010";
}

function createStudentDownloadToken(payload: StudentDownloadTokenPayload) {
  const expiresIn = (process.env.DOWNLOAD_LINK_EXPIRES_IN ||
    "3d") as SignOptions["expiresIn"];

  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(payload, getJwtSecret() as Secret, options);
}

function getFrontendBaseUrl() {
  return (process.env.FRONTEND_BASE_URL || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
}

function buildStudentDownloadUrl(token: string) {
  return `${getFrontendBaseUrl()}/#/download/${encodeURIComponent(token)}`;
}

function resolveDocumentFile(filePath: string | null | undefined) {
  if (!filePath) {
    throw new Error("File PDF dokumen belum tersedia");
  }

  let cleanPath = filePath;

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    cleanPath = new URL(cleanPath).pathname;
  }

  if (!cleanPath.startsWith("/uploads/documents/")) {
    throw new Error("Path dokumen tidak valid");
  }

  const absolutePath = path.resolve(
    process.cwd(),
    cleanPath.replace(/^\//, ""),
  );
  const rootPath = path.resolve(process.cwd(), "uploads", "documents");

  if (!absolutePath.startsWith(rootPath)) {
    throw new Error("Path dokumen tidak aman");
  }

  if (!fs.existsSync(absolutePath)) {
    throw new Error("File PDF tidak ditemukan di server");
  }

  return absolutePath;
}

function getDownloadFileName(params: { jenis: string; nim: string }) {
  return `${params.jenis}-${params.nim}.pdf`;
}

function isAllowedEmailSender(role: string | null | undefined) {
  return ["admin", "operator", "rektor"].includes(
    String(role || "").toLowerCase(),
  );
}

function isAllowedStaffDownloader(role: string | null | undefined) {
  return ["admin", "operator", "rektor"].includes(
    String(role || "").toLowerCase(),
  );
}

type BatchForEmail = NonNullable<Awaited<ReturnType<typeof findBatchForEmail>>>;

type MahasiswaForEmail = BatchForEmail["mahasiswa"][number];
type DokumenForEmail = MahasiswaForEmail["dokumen"][number];

async function findBatchForEmail(batchCode: string) {
  return prisma.batch_upload.findFirst({
    where: {
      uuid: batchCode,
    },
    include: {
      mahasiswa: {
        include: {
          dokumen: {
            where: {
              is_verified: true,
            },
            orderBy: {
              created_at: "desc",
            },
          },
        },
      },
    },
  });
}

function normalizeJenisDokumen(jenis: string | null | undefined) {
  return String(jenis || "")
    .toLowerCase()
    .trim();
}

function getPublishedDocumentsForEmail(mahasiswa: MahasiswaForEmail) {
  const documents = Array.isArray(mahasiswa.dokumen) ? mahasiswa.dokumen : [];

  const ijazah = documents.find(
    (doc) => normalizeJenisDokumen(doc.jenis_dokumen) === "ijazah",
  );

  const transkrip = documents.find(
    (doc) => normalizeJenisDokumen(doc.jenis_dokumen) === "transkrip",
  );

  return {
    ijazah,
    transkrip,
  };
}

function hasValidPublishedDocumentsForEmail(mahasiswa: MahasiswaForEmail) {
  const { ijazah, transkrip } = getPublishedDocumentsForEmail(mahasiswa);

  return Boolean(ijazah && transkrip);
}

function isDocumentDownloadable(doc: DokumenForEmail) {
  const punyaFile = Boolean(doc.file_pdf_final || doc.file_pdf);
  const downloadCount = doc.download_count ?? 0;
  const maxDownload = doc.max_download ?? 1;

  return punyaFile && downloadCount < maxDownload;
}
export async function sendBatchDocumentEmailService(params: {
  batchCode: string;
  idUser?: number | null;
  role?: string | null;
}) {
  if (!isAllowedEmailSender(params.role)) {
    throw new Error("Role tidak diizinkan mengirim email batch");
  }

  const batch = await findBatchForEmail(params.batchCode);

  if (!batch) {
    throw new Error("Batch tidak ditemukan");
  }

  const validMahasiswa = batch.mahasiswa.filter(
    hasValidPublishedDocumentsForEmail,
  );

  if (validMahasiswa.length === 0) {
    throw new Error("Batch tidak memiliki mahasiswa dengan dokumen valid");
  }

  const batchName =
    batch.nomor_batch_upload || `Batch ${batch.id_batch_upload}`;

  let berhasil = 0;
  let gagal = 0;

  const detailBerhasil: string[] = [];
  const detailGagal: string[] = [];

  for (const mahasiswa of validMahasiswa) {
    try {
      if (!mahasiswa.email) {
        gagal++;
        detailGagal.push(`${mahasiswa.nim} - email mahasiswa kosong`);
        continue;
      }

      const { ijazah, transkrip } = getPublishedDocumentsForEmail(mahasiswa);

      const dokumenValid = [ijazah, transkrip].filter(
        (doc): doc is DokumenForEmail => Boolean(doc),
      );

      const dokumenTidakSiap = dokumenValid.find(
        (doc) => !isDocumentDownloadable(doc),
      );

      if (dokumenTidakSiap) {
        gagal++;
        detailGagal.push(
          `${mahasiswa.nim} - dokumen ${dokumenTidakSiap.jenis_dokumen} belum tersedia atau sudah pernah didownload`,
        );
        continue;
      }

      const links = dokumenValid.map((doc) => {
        const token = createStudentDownloadToken({
          purpose: "student-download",
          id_dokumen: doc.id_dokumen,
          id_mahasiswa: mahasiswa.id_mahasiswa,
          jenis_dokumen: doc.jenis_dokumen,
        });

        return {
          jenis: doc.jenis_dokumen,
          url: buildStudentDownloadUrl(token),
        };
      });

      await sendStudentDocumentEmail({
        to: mahasiswa.email,
        nama: mahasiswa.nama_mahasiswa,
        nim: mahasiswa.nim,
        batchName,
        links,
      });

      berhasil++;
      detailBerhasil.push(`${mahasiswa.nim} - ${mahasiswa.email}`);
    } catch (error) {
      gagal++;
      detailGagal.push(
        `${mahasiswa.nim} - ${
          error instanceof Error ? error.message : "gagal kirim email"
        }`,
      );
    }
  }

  await prisma.log_aktivitas.create({
    data: {
      id_user: params.idUser ?? null,
      aktivitas: "SEND_EMAIL_BATCH",
      deskripsi: JSON.stringify({
        batch_code: batch.uuid,
        nomor_batch_upload: batch.nomor_batch_upload,
        total_mahasiswa_valid: validMahasiswa.length,
        berhasil,
        gagal,
        detail_berhasil: detailBerhasil,
        detail_gagal: detailGagal,
      }),
    },
  });

  return {
    batch_code: batch.uuid,
    nomor_batch_upload: batch.nomor_batch_upload,
    total_mahasiswa: validMahasiswa.length,
    berhasil,
    gagal,
    detail_gagal: detailGagal,
  };
}

export async function getStudentDownloadFileByToken(token: string) {
  let decoded: StudentDownloadTokenPayload;

  try {
    decoded = jwt.verify(token, getJwtSecret()) as StudentDownloadTokenPayload;
  } catch {
    throw new Error("Link download tidak valid atau sudah kedaluwarsa");
  }

  if (decoded.purpose !== "student-download") {
    throw new Error("Token download tidak valid");
  }

  const dokumen = await prisma.dokumen.findFirst({
    where: {
      id_dokumen: decoded.id_dokumen,
      id_mahasiswa: decoded.id_mahasiswa,
      is_verified: true,
    },
    include: {
      mahasiswa: true,
    },
  });

  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan");
  }

  const downloadCount = dokumen.download_count ?? 0;
  const maxDownload = dokumen.max_download ?? 1;

  if (downloadCount >= maxDownload) {
    throw new Error("Link download sudah pernah digunakan");
  }

  const absolutePath = resolveDocumentFile(
    dokumen.file_pdf_final || dokumen.file_pdf,
  );

  return {
    idDokumen: dokumen.id_dokumen,
    downloadCount,
    maxDownload,
    absolutePath,
    fileName: getDownloadFileName({
      jenis: dokumen.jenis_dokumen,
      nim: dokumen.mahasiswa?.nim || "mahasiswa",
    }),
  };
}

export async function getStaffDownloadFileByKodeQr(params: {
  kodeQr: string;
  role?: string;
}) {
  if (!isAllowedDownloader(params.role)) {
    throw new Error("Role tidak diizinkan download dokumen");
  }

  const dokumen = await prisma.dokumen.findFirst({
    where: {
      kode_qr: params.kodeQr,
      is_verified: true,
    },
    include: {
      mahasiswa: true,
    },
  });

  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan");
  }

  const absolutePath = resolveDocumentFile(
    dokumen.file_pdf_final || dokumen.file_pdf,
  );

  return {
    absolutePath,
    fileName: getDownloadFileName({
      jenis: dokumen.jenis_dokumen,
      nim: dokumen.mahasiswa?.nim || "mahasiswa",
    }),
  };
}
export async function getStaffPreviewFileByKodeQr(params: {
  kodeQr: string;
  role?: string;
}) {
  if (!isAllowedViewer(params.role)) {
    throw new Error("Role tidak diizinkan melihat dokumen");
  }

  const dokumen = await prisma.dokumen.findFirst({
    where: {
      kode_qr: params.kodeQr,
      is_verified: true,
    },
    include: {
      mahasiswa: true,
    },
  });

  if (!dokumen) {
    throw new Error("Dokumen tidak ditemukan");
  }

  const absolutePath = resolveDocumentFile(
    dokumen.file_pdf_final || dokumen.file_pdf,
  );

  return {
    absolutePath,
    fileName: getDownloadFileName({
      jenis: dokumen.jenis_dokumen,
      nim: dokumen.mahasiswa?.nim || "mahasiswa",
    }),
  };
}
export async function markStudentDocumentDownloaded(params: {
  idDokumen: number;
  downloadCount: number;
  maxDownload: number;
}) {
  await prisma.dokumen.update({
    where: {
      id_dokumen: params.idDokumen,
    },
    data: {
      download_count: params.downloadCount + 1,
      max_download: params.maxDownload,
      updated_at: new Date(),
    },
  });
}