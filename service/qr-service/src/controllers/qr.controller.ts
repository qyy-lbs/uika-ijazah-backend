import type { Request, Response } from "express";
import { generateQrCode } from "../services/qr.service.js";

export async function healthQr(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "QR Service berjalan",
    service: "qr-service",
  });
}

export async function testInternalQr(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Internal service key valid",
    data: {
      service: "qr-service",
    },
  });
}

export async function generateQr(req: Request, res: Response) {
  try {
    const body = req.body as {
      nim?: string;
      jenis_dokumen?: string;
      nomor_dokumen?: string;
    };

    const data = await generateQrCode({
      nim: body.nim ?? "",
      jenis_dokumen: body.jenis_dokumen ?? "",
      nomor_dokumen: body.nomor_dokumen ?? null,
    });

    return res.json({
      success: true,
      message: "QR berhasil dibuat",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}