import { getPrisma } from "../prisma/prisma.js";

const prisma = getPrisma();

export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({ 
    where: { email } 
  });
}

export async function findUserByIdForAuth(id_user: number) {
  return prisma.users.findUnique({
    where: { id_user },
    select: {
      id_user: true,
      email: true,
      role: true,
      id_unit: true,
      is_active: true,
      refresh_token: true,
    },
  });
}

export async function updateUserSession(id_user: number, refreshToken: string | null) {
  return prisma.users.update({
    where: { id_user },
    data: {
      refresh_token: refreshToken,
      // Hanya perbarui last_login jika sedang melakukan login (token tidak null)
      ...(refreshToken && { last_login: new Date() }), 
    },
  });
}