import { getPrisma } from "../prisma/prisma.js";

const prisma = getPrisma();

export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({ where: { email } });
}

export const findUserById = async (id_user: number) => {
  return await prisma.users.findUnique({
    where: { id_user: Number(id_user) },
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      
      // 🔥 1. TAMBAHKAN BARIS INI AGAR PRISMA MENARIK DATA TANGGALNYA
      created_at: true, 
      
      unit: true 
    }
  });
};
export async function createNewUser(data: any) {
  return prisma.users.create({
    data,
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true,
      created_at: true,
    },
  });
}

export async function findAllUsers() {
  return prisma.users.findMany({
    include: { unit: true },
    orderBy: { created_at: "desc" },
  });
}

export async function removeUserById(id_user: number) {
  return prisma.users.delete({ where: { id_user } });
}

export async function updateUserById(id_user: number, data: any) {
  return prisma.users.update({
    where: { id_user },
    data,
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true
    }
  });
}
