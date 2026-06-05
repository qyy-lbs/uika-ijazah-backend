import type { jenis_template_enum } from "@prisma/client";
import {
  createTemplate,
  findTemplateByJenis,
  updateTemplateById,
} from "../repositories/template.repository.js";
import {
  getDefaultLayout,
  parseLayout,
  toJsonInput,
  type TemplateAsset,
} from "../utils/template-layout.util.js";
import {
  IJAZAH_PLACEHOLDERS,
  TRANSKRIP_PLACEHOLDERS,
} from "../constants/placeholders.constant.js";
import fs from "fs";
import path from "path";

function normalizeJenisTemplate(jenis: string): jenis_template_enum {
  if (jenis !== "ijazah" && jenis !== "transkrip") {
    throw new Error(
      "Jenis template tidak valid. Gunakan ijazah atau transkrip.",
    );
  }

  return jenis as jenis_template_enum;
}

async function getOrCreateTemplate(
  jenis_template: jenis_template_enum,
  createdBy?: number | null,
) {
  const existing = await findTemplateByJenis(jenis_template);

  if (existing) {
    return existing;
  }

  return createTemplate({
    jenis_template,
    file_template: null,
    konfigurasi_layout: toJsonInput(getDefaultLayout()),
    created_by: createdBy ?? null,
  });
}

export async function getTemplateByJenis(
  jenis: string,
  createdBy?: number | null,
) {
  const jenis_template = normalizeJenisTemplate(jenis);

  const template = await getOrCreateTemplate(jenis_template, createdBy);

  const layout = parseLayout(template.konfigurasi_layout);

  return {
    id_template: template.id_template,
    uuid: template.uuid,
    jenis_template: template.jenis_template,
    file_template: template.file_template,
    konfigurasi_layout: layout,
    created_by: template.created_by,
    created_at: template.created_at,
    updated_at: template.updated_at,
  };
}
export async function uploadBackgroundTemplate(data: {
  jenis: string;
  fileUrl: string;
  originalName: string;
  name?: string;
  userId?: number | null;
}) {
  const jenis_template = normalizeJenisTemplate(data.jenis);

  const template = await getOrCreateTemplate(
    jenis_template,
    data.userId ?? null,
  );

  const layout = parseLayout(template.konfigurasi_layout);

  const assetId = `asset_${Date.now()}`;

  const shouldSetActive = layout.assets.length === 0;

  const newAsset: TemplateAsset = {
    id: assetId,
    name: data.name || data.originalName,
    originalName: data.originalName,
    src: data.fileUrl,
    isActive: shouldSetActive,
  };

  const updatedAssets = shouldSetActive
    ? [
        ...layout.assets.map((asset) => ({ ...asset, isActive: false })),
        newAsset,
      ]
    : [...layout.assets, newAsset];

  const updatedLayout = {
    ...layout,
    assets: updatedAssets,
    activeAssetId: shouldSetActive ? assetId : layout.activeAssetId,
  };

  const updatedTemplate = await updateTemplateById(template.id_template, {
    file_template: shouldSetActive ? data.fileUrl : template.file_template,
    konfigurasi_layout: toJsonInput(updatedLayout),
  });

  return {
    id_template: updatedTemplate.id_template,
    uuid: updatedTemplate.uuid,
    jenis_template: updatedTemplate.jenis_template,
    file_template: updatedTemplate.file_template,
    konfigurasi_layout: parseLayout(updatedTemplate.konfigurasi_layout),
    created_by: updatedTemplate.created_by,
    created_at: updatedTemplate.created_at,
    updated_at: updatedTemplate.updated_at,
  };
}
export async function selectBackgroundTemplate(data: {
  jenis: string;
  assetId: string;
  userId?: number | null;
}) {
  const jenis_template = normalizeJenisTemplate(data.jenis);

  const template = await getOrCreateTemplate(
    jenis_template,
    data.userId ?? null,
  );

  const layout = parseLayout(template.konfigurasi_layout);

  const selectedAsset = layout.assets.find(
    (asset) => asset.id === data.assetId,
  );

  if (!selectedAsset) {
    throw new Error("Background template tidak ditemukan");
  }

  const updatedAssets = layout.assets.map((asset) => ({
    ...asset,
    isActive: asset.id === data.assetId,
  }));

  const updatedLayout = {
    ...layout,
    assets: updatedAssets,
    activeAssetId: data.assetId,
  };

  const updatedTemplate = await updateTemplateById(template.id_template, {
    file_template: selectedAsset.src,
    konfigurasi_layout: toJsonInput(updatedLayout),
  });

  return {
    id_template: updatedTemplate.id_template,
    uuid: updatedTemplate.uuid,
    jenis_template: updatedTemplate.jenis_template,
    file_template: updatedTemplate.file_template,
    konfigurasi_layout: parseLayout(updatedTemplate.konfigurasi_layout),
    created_by: updatedTemplate.created_by,
    created_at: updatedTemplate.created_at,
    updated_at: updatedTemplate.updated_at,
  };
}
export async function deleteBackgroundTemplate(data: {
  jenis: string;
  assetId: string;
  userId?: number | null;
}) {
  const jenis_template = normalizeJenisTemplate(data.jenis);

  const template = await getOrCreateTemplate(jenis_template, data.userId ?? null);

  const layout = parseLayout(template.konfigurasi_layout);

  const selectedAsset = layout.assets.find(
    (asset) => asset.id === data.assetId
  );

  if (!selectedAsset) {
    throw new Error("Background template tidak ditemukan");
  }

  if (selectedAsset.isActive) {
    throw new Error("Background aktif tidak bisa dihapus");
  }

  const updatedLayout = {
    ...layout,
    assets: layout.assets.filter((asset) => asset.id !== data.assetId),
  };

  const updatedTemplate = await updateTemplateById(template.id_template, {
    konfigurasi_layout: toJsonInput(updatedLayout),
  });

  // Hapus file fisik setelah database berhasil diupdate
  deletePhysicalTemplateFile(selectedAsset.src);

  return {
    id_template: updatedTemplate.id_template,
    uuid: updatedTemplate.uuid,
    jenis_template: updatedTemplate.jenis_template,
    file_template: updatedTemplate.file_template,
    konfigurasi_layout: parseLayout(updatedTemplate.konfigurasi_layout),
    created_by: updatedTemplate.created_by,
    created_at: updatedTemplate.created_at,
    updated_at: updatedTemplate.updated_at,
  };
}
function deletePhysicalTemplateFile(fileUrl: string) {
  try {
    if (!fileUrl) return;

    let filePath = fileUrl;

    // Kalau URL absolute, ambil pathname-nya saja
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      const parsedUrl = new URL(fileUrl);
      filePath = parsedUrl.pathname;
    }

    // Kalau path-nya /uploads/templates/xxx.jpg
    const normalizedPath = filePath.replace(/^\/+/, "");

    const fullPath = path.join(process.cwd(), normalizedPath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Gagal menghapus file fisik template:", error);
  }
}
export async function updateTemplateLayout(data: {
  jenis: string;
  elements: unknown[];
  isSaved?: boolean;
  isLocked?: boolean;
  hasPreviewed?: boolean;
  userId?: number | null;
}) {
  const jenis_template = normalizeJenisTemplate(data.jenis);

  const template = await getOrCreateTemplate(
    jenis_template,
    data.userId ?? null,
  );

  const layout = parseLayout(template.konfigurasi_layout);

  const updatedLayout = {
    ...layout,

    // hanya update elements dan status editor
    // assets dan activeAssetId tetap dipertahankan
    elements: data.elements as typeof layout.elements,

    isSaved: data.isSaved ?? layout.isSaved,
    isLocked: data.isLocked ?? layout.isLocked,
    hasPreviewed: data.hasPreviewed ?? layout.hasPreviewed,
  };

  const updatedTemplate = await updateTemplateById(template.id_template, {
    konfigurasi_layout: toJsonInput(updatedLayout),
  });

  return {
    id_template: updatedTemplate.id_template,
    uuid: updatedTemplate.uuid,
    jenis_template: updatedTemplate.jenis_template,
    file_template: updatedTemplate.file_template,
    konfigurasi_layout: parseLayout(updatedTemplate.konfigurasi_layout),
    created_by: updatedTemplate.created_by,
    created_at: updatedTemplate.created_at,
    updated_at: updatedTemplate.updated_at,
  };
}
export function getPlaceholdersByJenis(jenis: string) {
  const jenis_template = normalizeJenisTemplate(jenis);

  if (jenis_template === "ijazah") {
    return IJAZAH_PLACEHOLDERS;
  }

  return TRANSKRIP_PLACEHOLDERS;
}
