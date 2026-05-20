import type { Request, Response }
from "express";

import { getStatistikValidasiService }
from "../services/statistik.service.js";

export const getStatistikValidasi =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const data =
        await getStatistikValidasiService();

      res.status(200).json({
        success: true,
        data
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  };