import type { Response } from "express";
import type { CustomRequest } from "../middlewares/masterMiddleware.js";
import * as profileService from "../services/profile.service.js";

// Controller: Profil Umum
export const getProfile = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const data = await profileService.getProfileData(req.user);
    res.status(200).json({
      status: "success",
      message: "Data profil berhasil diambil.",
      data,
    });
  } catch (error: any) {
    res.status(401).json({
      status: "error",
      message: error.message || "Gagal mengambil data profil.",
    });
  }
};

// Controller: Dashboard Level Universitas (Rektorat)
export const getRektoratDashboard = async (
  req: CustomRequest,
  res: Response,
): Promise<void> => {
  try {
    const dashboardData = await profileService.getRektoratDashboardData(req.user?.role);
    res.status(200).json({
      status: "success",
      ...dashboardData
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat memuat dashboard rektorat.",
    });
  }
};

// Controller: Dashboard Level Fakultas
export const getFakultasDashboard = async (
  req: CustomRequest,
  res: Response,
): Promise<void> => {
  try {
    const dashboardData = await profileService.getFakultasDashboardData(req.user?.role);
    res.status(200).json({
      status: "success",
      ...dashboardData
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat memuat dashboard fakultas.",
    });
  }
};

// Controller: Dashboard Operasional (Operator Data)
export const getOperasionalDashboard = async (
  req: CustomRequest,
  res: Response,
): Promise<void> => {
  try {
    const dashboardData = await profileService.getOperasionalDashboardData(req.user?.role);
    res.status(200).json({
      status: "success",
      ...dashboardData
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat memuat dashboard operasional.",
    });
  }
};