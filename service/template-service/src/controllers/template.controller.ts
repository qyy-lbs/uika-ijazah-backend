import type { Request, Response } from "express";
import type { CustomRequest } from "../middlewares/auth.middleware.js";
import { getTemplateByJenis,uploadBackgroundTemplate,selectBackgroundTemplate,deleteBackgroundTemplate, updateTemplateLayout, getPlaceholdersByJenis } from "../services/template.service.js";

export async function healthTemplate(_req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Template Service berjalan",
    service: "template-service",
  });
}

export async function getTemplateMe(req: CustomRequest, res: Response) {
  return res.json({
    success: true,
    message: "Token template-service valid",
    data: {
      user: req.user,
    },
  });
}

export async function getTemplate(req: CustomRequest, res: Response) {
  try {
    const jenisParam = req.params.jenis;

    if (!jenisParam) {
      return res.status(400).json({
        success: false,
        message: "Jenis template wajib diisi",
      });
    }

    if (Array.isArray(jenisParam)) {
      return res.status(400).json({
        success: false,
        message: "Jenis template tidak valid",
      });
    }

    const jenis = jenisParam;

    const data = await getTemplateByJenis(jenis, req.user?.id_user ?? null);

    return res.json({
      success: true,
      message: "Template berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function uploadBackground(req: CustomRequest, res: Response) {
  try {
    const jenis = req.params.jenis;

    if (!jenis || Array.isArray(jenis)) {
      return res.status(400).json({
        success: false,
        message: "Jenis template tidak valid",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File background wajib diupload",
      });
    }

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3008";

    const fileUrl = `${publicBaseUrl}/uploads/templates/${req.file.filename}`;

    const data = await uploadBackgroundTemplate({
      jenis,
      fileUrl,
      originalName: req.file.originalname,
      name: req.body.name,
      userId: req.user?.id_user ?? null,
    });

    return res.json({
      success: true,
      message: "Background template berhasil diupload",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}

export async function selectBackground(req: CustomRequest, res: Response) {
  try {
    const jenis = req.params.jenis;

    if (!jenis || Array.isArray(jenis)) {
      return res.status(400).json({
        success: false,
        message: "Jenis template tidak valid",
      });
    }

    const { assetId } = req.body as { assetId?: string };

    if (!assetId) {
      return res.status(400).json({
        success: false,
        message: "assetId wajib diisi",
      });
    }

    const data = await selectBackgroundTemplate({
      jenis,
      assetId,
      userId: req.user?.id_user ?? null,
    });

    return res.json({
      success: true,
      message: "Background aktif berhasil dipilih",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function deleteBackground(req: CustomRequest, res: Response) {
  try {
    const jenis = req.params.jenis;
    const assetId = req.params.assetId;

    if (!jenis || Array.isArray(jenis)) {
      return res.status(400).json({
        success: false,
        message: "Jenis template tidak valid",
      });
    }

    if (!assetId || Array.isArray(assetId)) {
      return res.status(400).json({
        success: false,
        message: "assetId tidak valid",
      });
    }

    const data = await deleteBackgroundTemplate({
      jenis,
      assetId,
      userId: req.user?.id_user ?? null,
    });

    return res.json({
      success: true,
      message: "Background template berhasil dihapus",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function saveLayout(req: CustomRequest, res: Response) {
  try {
    const jenis = req.params.jenis;

    if (!jenis || Array.isArray(jenis)) {
      return res.status(400).json({
        success: false,
        message: "Jenis template tidak valid",
      });
    }

    const body = req.body as {
      elements?: unknown[];
      isSaved?: boolean;
      isLocked?: boolean;
      hasPreviewed?: boolean;
    };

    if (!Array.isArray(body.elements)) {
      return res.status(400).json({
        success: false,
        message: "elements wajib berupa array",
      });
    }

    const data = await updateTemplateLayout({
      jenis,
      elements: body.elements,
      isSaved: body.isSaved,
      isLocked: body.isLocked,
      hasPreviewed: body.hasPreviewed,
      userId: req.user?.id_user ?? null,
    });

    return res.json({
      success: true,
      message: "Layout template berhasil disimpan",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}
export async function getPlaceholders(req: CustomRequest, res: Response) {
  try {
    const jenis = req.params.jenis;

    if (!jenis || Array.isArray(jenis)) {
      return res.status(400).json({
        success: false,
        message: "Jenis template tidak valid",
      });
    }

    const data = getPlaceholdersByJenis(jenis);

    return res.json({
      success: true,
      message: "Placeholder template berhasil diambil",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan",
    });
  }
}