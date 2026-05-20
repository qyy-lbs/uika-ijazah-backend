import type { Request, Response } from "express";

import {
  getBatchDashboardService,
  getBatchService,
} from "../services/batch.service.js";

import { getDetailBatchService }
from "../services/detail-batch.service.js";

export const getBatches = async (
  req: Request,
  res: Response
) => {

  try {

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const tahun_lulus =
      req.query.tahun_lulus as string;

    const periode =
      req.query.periode as string;

    const search =
      req.query.search as string;

    const data =
      await getBatchService(
        page,
        limit,
        tahun_lulus,
        periode,
        search
      );

    res.status(200).json({
      success: true,
      ...data,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }
};

export const getDashboardBatch = async (
  req: Request,
  res: Response
) => {

  try {

    const data =
      await getBatchDashboardService();

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

export const getDetailBatch = async (
  req: Request,
  res: Response
) => {

  try {

    const id = Number(req.params.id);

    const status =
      req.query.status as string;

    const data =
      await getDetailBatchService(
        id,
        status
      );

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