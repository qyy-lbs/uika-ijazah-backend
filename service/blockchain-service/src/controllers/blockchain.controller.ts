import type { Request, Response } from "express";
import { recordDocumentToBlockchain } from "../services/blockchain.service.js";

export async function healthBlockchain(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Blockchain Service berjalan",
    service: "blockchain-service",
  });
}

export async function testInternalBlockchain(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Internal service key valid",
    data: {
      service: "blockchain-service",
    },
  });
}

export async function recordBlockchain(req: Request, res: Response) {
  try {
    const body = req.body as {
      id_dokumen?: number;
    };

    const data = await recordDocumentToBlockchain({
      id_dokumen: Number(body.id_dokumen),
    });

    return res.json({
      success: true,
      message: data.already_recorded
        ? "Dokumen sudah pernah dicatat ke blockchain"
        : "Dokumen berhasil dicatat ke blockchain",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}