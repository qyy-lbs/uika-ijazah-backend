import type { Request, Response } from "express";
import {
  getBlockchainByDocument,
  getBlockchainChain,
  mineDocumentBlock,
  verifyDocumentBlock,
  verifyFullChain,
} from "../services/blockchain.service.js";

export async function healthBlockchain(req: Request, res: Response) {
  res.json({
    success: true,
    message: "Blockchain Service berjalan",
  });
}

export async function mineDocument(req: Request, res: Response) {
  try {
    const idDokumen = Number(req.body.id_dokumen);

    if (!idDokumen || Number.isNaN(idDokumen)) {
      res.status(400).json({
        success: false,
        message: "id_dokumen wajib dikirim",
      });
      return;
    }

    const hashDokumen =
      typeof req.body.hash_dokumen === "string" &&
      req.body.hash_dokumen.trim() !== ""
        ? req.body.hash_dokumen.trim()
        : undefined;

    const result = await mineDocumentBlock({
      id_dokumen: idDokumen,
      hash_dokumen: hashDokumen,
    });

    res.status(result.already_exists ? 200 : 201).json({
      success: true,
      message: result.already_exists
        ? "Dokumen sudah tercatat di blockchain"
        : "Dokumen berhasil dicatat ke blockchain",
      data: result.block,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat block";

    res.status(message === "Dokumen tidak ditemukan" ? 404 : 500).json({
      success: false,
      message,
    });
  }
}

export async function verifyDocument(req: Request, res: Response) {
  try {
    const idDokumen = Number(req.params.id_dokumen);

    if (!idDokumen || Number.isNaN(idDokumen)) {
      res.status(400).json({
        success: false,
        message: "id_dokumen tidak valid",
      });
      return;
    }

    const result = await verifyDocumentBlock(idDokumen);

    res.json({
      success: true,
      data: result,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Gagal verifikasi blockchain dokumen",
    });
  }
}

export async function verifyChain(req: Request, res: Response) {
  try {
    const result = await verifyFullChain();

    res.json({
      success: true,
      data: result,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Gagal verifikasi rantai blockchain",
    });
  }
}

export async function getChain(req: Request, res: Response) {
  try {
    const chain = await getBlockchainChain();

    res.json({
      success: true,
      data: chain,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data blockchain",
    });
  }
}

export async function getByDocument(req: Request, res: Response) {
  try {
    const idDokumen = Number(req.params.id_dokumen);

    if (!idDokumen || Number.isNaN(idDokumen)) {
      res.status(400).json({
        success: false,
        message: "id_dokumen tidak valid",
      });
      return;
    }

    const block = await getBlockchainByDocument(idDokumen);

    if (!block) {
      res.status(404).json({
        success: false,
        message: "Data blockchain tidak ditemukan",
      });
      return;
    }

    res.json({
      success: true,
      data: block,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil blockchain dokumen",
    });
  }
}