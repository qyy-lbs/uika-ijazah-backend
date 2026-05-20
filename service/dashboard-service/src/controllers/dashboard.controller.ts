import type { Request, Response } from "express";

import {
  getSummaryService,
} from "../services/dashboard.service.js";

import {
  getLatestValidationService,
} from "../services/dashboard.service.js";

export const getHealth = async (
  req: Request,
  res: Response
) => {
  return res.status(200).json({
    success: true,
    message: "Dashboard Service Active",
  });
};

export const getLatestValidation = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getLatestValidationService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getSummaryService();

    return res.status(200).json({
      success: true,
      message: "Summary dashboard berhasil diambil",
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};