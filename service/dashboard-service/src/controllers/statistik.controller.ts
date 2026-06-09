import type { Request, Response } from "express";

import {
  getStatistikTahunanService,
  getStatistikValidasiService,
} from "../services/statistik.service.js";

export const getStatistikTahunan = async (req: Request, res: Response) => {
  try {
    const data = await getStatistikTahunanService();

    res.status(200).json({
      success: true,
      raw: data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      raw: [],
    });
  }
};

export const getStatistikValidasi = async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;

    const data = await getStatistikValidasiService(year);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
