import { fetchJson } from "../utils/http-client.util.js";

export type TemplateElement = {
  id: string | number;
  label?: string;
  placeholder?: string;
  field?: string;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
};

export type TemplateLayout = {
  activeAssetId: string | null;
  assets: unknown[];
  elements: TemplateElement[];
  isSaved: boolean;
  isLocked: boolean;
  hasPreviewed: boolean;
};

export type TemplateDocument = {
  id_template: number;
  uuid: string | null;
  jenis_template: "ijazah" | "transkrip";
  file_template: string | null;
  konfigurasi_layout: TemplateLayout;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type TemplateInternalResponse = {
  success: boolean;
  message: string;
  data: TemplateDocument;
};

export async function getTemplateForDocument(jenis: "ijazah" | "transkrip") {
  const baseUrl = process.env.TEMPLATE_SERVICE_URL;
  const internalKey = process.env.INTERNAL_SERVICE_KEY;

  if (!baseUrl) {
    throw new Error("TEMPLATE_SERVICE_URL belum diatur");
  }

  if (!internalKey) {
    throw new Error("INTERNAL_SERVICE_KEY belum diatur");
  }

  const url = `${baseUrl}/api/template/internal/${jenis}`;

  const result = await fetchJson<TemplateInternalResponse>(url, {
    headers: {
      "x-internal-service-key": internalKey,
    },
  });

  return result.data;
}