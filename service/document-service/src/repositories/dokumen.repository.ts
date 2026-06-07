import prisma from "../prisma/prisma.js";
import type { jenis_dokumen_enum } from "@prisma/client";

type CreateOrUpdateDokumenInput = {
  id_mahasiswa: number;
  id_template: number | null;
  jenis_dokumen: jenis_dokumen_enum;
  nomor_dokumen?: string | null;
  tanggal_terbit?: Date | null;
  file_pdf?: string | null;
  file_pdf_final?: string | null;
  kode_qr?: string | null;
  url_akses?: string | null;
  is_verified?: boolean;
};

export async function findDokumenByMahasiswaAndJenis(
  id_mahasiswa: number,
  jenis_dokumen: jenis_dokumen_enum
) {
  return prisma.dokumen.findFirst({
    where: {
      id_mahasiswa,
      jenis_dokumen,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export async function createDokumen(data: CreateOrUpdateDokumenInput) {
  return prisma.dokumen.create({
    data: {
      id_mahasiswa: data.id_mahasiswa,
      id_template: data.id_template,
      jenis_dokumen: data.jenis_dokumen,
      nomor_dokumen: data.nomor_dokumen ?? null,
      tanggal_terbit: data.tanggal_terbit ?? new Date(),
      file_pdf: data.file_pdf ?? null,
      file_pdf_final: data.file_pdf_final ?? null,
      kode_qr: data.kode_qr ?? null,
      url_akses: data.url_akses ?? null,
      is_verified: data.is_verified ?? false,
    },
  });
}

export async function updateDokumen(
  id_dokumen: number,
  data: Partial<CreateOrUpdateDokumenInput>
) {
  return prisma.dokumen.update({
    where: {
      id_dokumen,
    },
    data: {
      id_template: data.id_template,
      nomor_dokumen: data.nomor_dokumen,
      tanggal_terbit: data.tanggal_terbit,
      file_pdf: data.file_pdf,
      file_pdf_final: data.file_pdf_final,
      kode_qr: data.kode_qr,
      url_akses: data.url_akses,
      is_verified: data.is_verified,
      updated_at: new Date(),
    },
  });
}

export async function upsertDokumenByMahasiswaAndJenis(
  data: CreateOrUpdateDokumenInput
) {
  const existing = await findDokumenByMahasiswaAndJenis(
    data.id_mahasiswa,
    data.jenis_dokumen
  );

  if (existing) {
    return updateDokumen(existing.id_dokumen, data);
  }

  return createDokumen(data);
}

export async function findDokumenByNim(nim: string) {
  return prisma.dokumen.findMany({
    where: {
      mahasiswa: {
        nim,
      },
    },
    include: {
      mahasiswa: {
        select: {
          id_mahasiswa: true,
          nim: true,
          nama_mahasiswa: true,
        },
      },
      template: {
        select: {
          id_template: true,
          jenis_template: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

export async function findDokumenById(id_dokumen: number) {
  return prisma.dokumen.findUnique({
    where: {
      id_dokumen,
    },
    include: {
      mahasiswa: {
        select: {
          id_mahasiswa: true,
          nim: true,
          nama_mahasiswa: true,
        },
      },
      template: {
        select: {
          id_template: true,
          jenis_template: true,
        },
      },
    },
  });
}
export async function findDokumenByKodeQr(kode_qr: string) {
  return prisma.dokumen.findFirst({
    where: {
      kode_qr,
    },
    include: {
      mahasiswa: {
        select: {
          id_mahasiswa: true,
          nim: true,
          nama_mahasiswa: true,
          nik: true,
          tempat_lahir: true,
          tanggal_lahir: true,
          jenis_kelamin: true,
          foto: true,
          prodi: {
            include: {
              unit: true,
            },
          },
        },
      },
      template: {
        select: {
          id_template: true,
          jenis_template: true,
        },
      },
    },
  });
}

export async function findBlockchainByDokumen(id_dokumen: number) {
  return prisma.blockchain.findFirst({
    where: {
      id_dokumen,
    },
    orderBy: {
      created_at: "desc",
    },
  });
}