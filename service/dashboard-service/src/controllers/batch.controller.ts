import type { Request, Response } from "express";
import {
  getBatchDashboardService,
  getBatchService,getDetailBatchService
} from "../services/batch.service.js";

import { decodeId } from "../helpers/hashid.helper.js";

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

    const status =
      req.query.status as string;

    const data =
      await getBatchService(
        page,
        limit,
        tahun_lulus,
        periode,
        search,
        status
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
   const batchCodeParam = req.params.batchCode || req.params.id;

const batchCode = Array.isArray(batchCodeParam)
  ? batchCodeParam[0]
  : batchCodeParam;

if (!batchCode || typeof batchCode !== "string") {
  return res.status(400).json({
    success: false,
    message: "Kode batch wajib diisi",
  });
}

const batchId = decodeId("batch", batchCode);

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Kode batch tidak valid",
      });
    }

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : "";

    const data = await getDetailBatchService(
      Number(batchId),
      status
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Batch tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};