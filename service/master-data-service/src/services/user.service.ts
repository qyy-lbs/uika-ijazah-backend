import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/user.repository.js";
import { getPrisma } from "../prisma/prisma.js"; 
const prisma = getPrisma();

export async function createUser(data: any) {
  const { email, password, role, id_unit } = data;

  if (!email || !password || !role) {
    throw new Error("Email, password, dan role wajib diisi!");
  }

  const existingUser = await userRepository.findUserByEmail(email);
  if (existingUser) {
    throw new Error("Gagal! Email tersebut sudah digunakan.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return userRepository.createNewUser({
    email,
    password: hashedPassword,
    role,
    id_unit: id_unit || null,
    is_active: true,
  });
}

export async function getAllUsers() {
  return userRepository.findAllUsers();
}

export async function deleteUser(id: string) {
  const userId = Number(id);
  const existingUser = await userRepository.findUserById(Number(id));
  if (!existingUser) throw new Error("User tidak ditemukan.");
  
  return userRepository.removeUserById(Number(id));
}

export async function editUser(id: string, data: any) {
  const { email, password, role, id_unit } = data;

  const existingUser = await userRepository.findUserById(Number(id));
  if (!existingUser) {
    throw new Error("User tidak ditemukan");
  }

  const updateData: any = { email, role, id_unit };

  if (password && password.trim() !== "") { 
    updateData.password = await bcrypt.hash(password, 10);
  }

  return userRepository.updateUserById(Number(id), updateData);
}


export async function changePassword(userId: number, data: any) {
  const { oldPassword, newPassword } = data;

  // 🔥 KUNCI PERBAIKAN: Kita pakai Prisma langsung di sini, jangan pakai userRepository 
  // karena userRepository biasanya menyembunyikan kolom password demi keamanan.
  const user: any = await prisma.users.findUnique({
    where: { id_user: userId }
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  // Pengecekan ekstra agar bcrypt tidak error "undefined"
  if (!user.password) {
    throw new Error("Sistem gagal membaca kata sandi lama dari database.");
  }

  // Bandingkan password lama
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Kata sandi saat ini salah! Silakan coba lagi.");
  }

  // Hash password baru
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update ke database
  return prisma.users.update({
    where: { id_user: userId },
    data: { password: hashedPassword }
  });
}