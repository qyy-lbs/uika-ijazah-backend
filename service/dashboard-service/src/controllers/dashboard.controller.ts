import type { Request, Response } from "express";

import {
  getSummaryService,
  getLatestValidationService,
} from "../services/dashboard.service.js";

export const getHealth = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Dashboard Service Active",
  });
};

export const getLatestValidation = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";

    const data = await getLatestValidationService(page, limit, search, );

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getSummary = async (req: Request, res: Response) => {
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
