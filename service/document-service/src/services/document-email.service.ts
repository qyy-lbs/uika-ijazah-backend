import fs from "fs";
import path from "path";
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import prisma from "../prisma/prisma.js";
import { sendStudentDocumentEmail } from "./mail.service.js";

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
  const expiresIn = (
    process.env.DOWNLOAD_LINK_EXPIRES_IN || "3d"
  ) as SignOptions["expiresIn"];

  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(
    payload,
    getJwtSecret() as Secret,
    options,
  );
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

  const absolutePath = path.resolve(process.cwd(), cleanPath.replace(/^\//, ""));
  const rootPath = path.resolve(process.cwd(), "uploads", "documents");

  if (!absolutePath.startsWith(rootPath)) {
    throw new Error("Path dokumen tidak aman");
  }

  if (!fs.existsSync(absolutePath)) {
    throw new Error("File PDF tidak ditemukan di server");
  }

  return absolutePath;
}

function getDownloadFileName(params: {
  jenis: string;
  nim: string;
}) {
  return `${params.jenis}-${params.nim}.pdf`;
}

function isAllowedEmailSender(role: string | null | undefined) {
  return ["admin", "operator", "rektor"].includes(String(role || "").toLowerCase());
}

function isAllowedStaffDownloader(role: string | null | undefined) {
  return ["admin", "operator", "rektor"].includes(String(role || "").toLowerCase());
}

export async function sendBatchDocumentEmailService(params: {
  batchCode: string;
  idUser?: number | null;
  role?: string | null;
}) {
  if (!isAllowedEmailSender(params.role)) {
    throw new Error("Role tidak diizinkan mengirim email batch");
  }

  const batch = await prisma.batch_upload.findFirst({
    where: {
      uuid: params.batchCode,
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

  if (!batch) {
    throw new Error("Batch tidak ditemukan");
  }

  const batchName =
    batch.nomor_batch_upload || `Batch ${batch.id_batch_upload}`;

  let berhasil = 0;
  let gagal = 0;

  const detailBerhasil: string[] = [];
  const detailGagal: string[] = [];

  for (const mahasiswa of batch.mahasiswa) {
    try {
      if (!mahasiswa.email) {
        gagal++;
        detailGagal.push(`${mahasiswa.nim} - email mahasiswa kosong`);
        continue;
      }

      const dokumenValid = mahasiswa.dokumen.filter((doc) => {
        const punyaFile = Boolean(doc.file_pdf_final || doc.file_pdf);
        const downloadCount = doc.download_count ?? 0;
        const maxDownload = doc.max_download ?? 1;

        return punyaFile && downloadCount < maxDownload;
      });

      if (dokumenValid.length === 0) {
        gagal++;
        detailGagal.push(
          `${mahasiswa.nim} - dokumen belum tersedia atau sudah pernah didownload`,
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
    total_mahasiswa: batch.mahasiswa.length,
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

  await prisma.dokumen.update({
    where: {
      id_dokumen: dokumen.id_dokumen,
    },
    data: {
      download_count: downloadCount + 1,
      max_download: maxDownload,
      updated_at: new Date(),
    },
  });

  return {
    absolutePath,
    fileName: getDownloadFileName({
      jenis: dokumen.jenis_dokumen,
      nim: dokumen.mahasiswa?.nim || "mahasiswa",
    }),
  };
}

export async function getStaffDownloadFileByKodeQr(params: {
  kodeQr: string;
  role?: string | null;
}) {
  if (!isAllowedStaffDownloader(params.role)) {
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