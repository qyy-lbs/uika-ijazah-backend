import prisma from "../prisma/prisma.js";

export async function createLogAktivitas(data: {
  id_user: number;
  aktivitas: string;
  deskripsi: string;
}) {
  return prisma.log_aktivitas.create({
    data: {
      id_user: data.id_user,
      aktivitas: data.aktivitas,
      deskripsi: data.deskripsi,
      created_at: new Date(),
    },
  });
}