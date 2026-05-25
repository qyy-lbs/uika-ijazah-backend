import type {
  Request,
  Response,
} from "express";

import {
  getStatistikTahunanService,
} from "../services/statistik-tahunan.service.js";

export const getStatistikTahunan =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const data =
        await getStatistikTahunanService();

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