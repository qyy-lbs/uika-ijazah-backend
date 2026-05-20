// ==================== PROFILE SERVICE ====================

export async function getProfileData(user: any) {
  if (!user) {
    throw new Error("Identitas pengguna tidak ditemukan atau tidak valid.");
  }
  return user;
}

export async function getRektoratDashboardData(role?: string) {
  return {
    message: "Selamat datang di Dashboard Rektorat.",
    akses: "Level Universitas",
    user_aktif: role,
  };
}

export async function getFakultasDashboardData(role?: string) {
  return {
    message: "Selamat datang di Dashboard Fakultas.",
    akses: "Level Fakultas",
    user_aktif: role,
  };
}

export async function getOperasionalDashboardData(role?: string) {
  return {
    message: "Selamat datang di Ruang Kerja Operator.",
    akses: "Level Operasional",
    user_aktif: role,
  };
}