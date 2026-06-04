import type {
  Request,
  Response,
} from "express";

import {
  getStatistikValidasiService,
} from "../services/statistik.service.js";

export const getStatistikValidasi =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const year =
        req.query.year
          ? Number(req.query.year)
          : undefined;

      const data =
        await getStatistikValidasiService(year);
      
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error",
      });
    }
  };