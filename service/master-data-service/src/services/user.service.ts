import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/user.repository.js";

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