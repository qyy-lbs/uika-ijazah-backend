import prisma from "../prisma/prisma.js";
import type { Prisma, jenis_template_enum } from "@prisma/client";

export async function findTemplateByJenis(jenis_template: jenis_template_enum) {
  return prisma.template.findFirst({
    where: {
      jenis_template,
    },
    // Pastikan selalu ambil record pertama yang dibuat, bukan random
    orderBy: {
      id_template: "asc",
    },
  });
}

export async function createTemplate(data: {
  jenis_template: jenis_template_enum;
  file_template?: string | null;
  konfigurasi_layout?: Prisma.InputJsonValue;
  created_by?: number | null;
}) {
  return prisma.template.create({
    data: {
      jenis_template: data.jenis_template,
      file_template: data.file_template ?? null,
      konfigurasi_layout: data.konfigurasi_layout ?? {},
      created_by: data.created_by ?? null,
    },
  });
}

export async function updateTemplateById(
  id_template: number,
  data: {
    file_template?: string | null;
    konfigurasi_layout?: Prisma.InputJsonValue;
  }
) {
  return prisma.template.update({
    where: {
      id_template,
    },
    data,
  });
}
