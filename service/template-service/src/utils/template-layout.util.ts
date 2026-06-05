import type { Prisma } from "@prisma/client";

export type TemplateAsset = {
  id: string;
  name: string;
  originalName: string;
  src: string;
  isActive: boolean;
};

export type TemplateElement = {
  id: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
};

export type TemplateLayout = {
  activeAssetId: string | null;
  assets: TemplateAsset[];
  elements: TemplateElement[];
  isSaved: boolean;
  isLocked: boolean;
  hasPreviewed: boolean;
};

export function getDefaultLayout(): TemplateLayout {
  return {
    activeAssetId: null,
    assets: [],
    elements: [],
    isSaved: false,
    isLocked: false,
    hasPreviewed: false,
  };
}

export function parseLayout(layout: Prisma.JsonValue | null): TemplateLayout {
  if (!layout || typeof layout !== "object" || Array.isArray(layout)) {
    return getDefaultLayout();
  }

  const data = layout as Partial<TemplateLayout>;

  return {
    activeAssetId: data.activeAssetId ?? null,
    assets: Array.isArray(data.assets) ? data.assets : [],
    elements: Array.isArray(data.elements) ? data.elements : [],
    isSaved: Boolean(data.isSaved),
    isLocked: Boolean(data.isLocked),
    hasPreviewed: Boolean(data.hasPreviewed),
  };
}

export function toJsonInput(layout: TemplateLayout): Prisma.InputJsonValue {
  return layout as unknown as Prisma.InputJsonValue;
}