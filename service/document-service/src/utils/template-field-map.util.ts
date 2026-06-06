import type { TemplateElement } from "../clients/template.client.js";

type ElementType = "text" | "image" | "qr" | "table" | "signature";

type FieldMapping = {
  field: string;
  type: ElementType;
  fontSize?: number;
  fontWeight?: string;
  align?: string;
  roleLabel?: string;
};

type NormalizedTemplateElement = TemplateElement & {
  field?: string;
  type?: ElementType;
  fontSize?: number;
  fontWeight?: string;
  align?: string;
  roleLabel?: string;
};

const IJAZAH_FIELD_MAP: Record<string, FieldMapping> = {
  Nama: {
    field: "mahasiswa.nama",
    type: "text",
  },
  "Tempat & Tanggal Lahir": {
    field: "mahasiswa.tempat_tanggal_lahir",
    type: "text",
  },
  "Nomor Pokok Mahasiswa": {
    field: "mahasiswa.nomor_pokok_mahasiswa",
    type: "text",
  },
  NIK: {
    field: "mahasiswa.nik",
    type: "text",
  },
  Fakultas: {
    field: "akademik.fakultas",
    type: "text",
  },
  "Fakultas (English)": {
    field: "akademik.fakultas_en",
    type: "text",
  },
  "Program Studi": {
    field: "akademik.program_studi",
    type: "text",
  },
  "Program Studi (English)": {
    field: "akademik.program_studi_en",
    type: "text",
  },
  Program: {
    field: "akademik.program",
    type: "text",
  },
  "Program (English)": {
    field: "akademik.program_en",
    type: "text",
  },
  "Tanggal Kelulusan": {
    field: "akademik.tanggal_kelulusan_formatted",
    type: "text",
  },
  PISN: {
    field: "mahasiswa.pisn",
    type: "text",
  },
  "Nomor Seri Ijazah": {
    field: "mahasiswa.nomor_seri_ijazah",
    type: "text",
  },
  "Akreditasi AIPT": {
    field: "akademik.akreditasi_aipt",
    type: "text",
  },
  Foto: {
    field: "mahasiswa.foto",
    type: "image",
  },
  "QR Code": {
    field: "dokumen_placeholder.qr_code",
    type: "qr",
  },
  Gelar: {
    field: "mahasiswa.gelar",
    type: "text",
  },
  "Tanggal Terbit": {
    field: "dokumen_placeholder.tanggal_terbit_formatted",
    type: "text",
  },
  "Nama Rektor": {
    field: "pejabat.nama_rektor",
    type: "text",
  },
  "TTD Rektor": {
    field: "assets.ttd_rektor",
    type: "image",
  },
  "NIDN Rektor": {
    field: "pejabat.nidn_rektor",
    type: "text",
  },
  "Nama Dekan": {
    field: "pejabat.nama_dekan",
    type: "text",
  },
  "TTD Dekan": {
    field: "assets.ttd_dekan",
    type: "image",
  },
  "NIDN Dekan": {
    field: "pejabat.nidn_dekan",
    type: "text",
  },
  "Paraf KATU Rektor": {
    field: "assets.paraf_katu_rektor",
    type: "image",
  },
  "Paraf WAREK": {
    field: "assets.paraf_warek",
    type: "image",
  },
  "Paraf KATU Fakultas": {
    field: "assets.paraf_katu_fakultas",
    type: "image",
  },
  "Paraf Wadek": {
    field: "assets.paraf_wadek",
    type: "image",
  },
  "Stempel Rektor": {
    field: "assets.stempel_rektor",
    type: "image",
  },
  "Stempel Dekan": {
    field: "assets.stempel_dekan",
    type: "image",
  },
};

const TRANSKRIP_FIELD_MAP: Record<string, FieldMapping> = {
  Nomor: {
    field: "dokumen_placeholder.nomor_dokumen",
    type: "text",
  },
  Nama: {
    field: "mahasiswa.nama",
    type: "text",
  },
  "Tempat & Tanggal Lahir": {
    field: "mahasiswa.tempat_tanggal_lahir",
    type: "text",
  },
  "Jenis Kelamin": {
    field: "mahasiswa.jenis_kelamin",
    type: "text",
  },
  "Nomor Pokok Mahasiswa": {
    field: "mahasiswa.nomor_pokok_mahasiswa",
    type: "text",
  },
  NINA: {
    field: "mahasiswa.nina",
    type: "text",
  },
  NIK: {
    field: "mahasiswa.nik",
    type: "text",
  },
  "Tahun Masuk": {
    field: "mahasiswa.tahun_masuk",
    type: "text",
  },
  "Program Pendidikan": {
    field: "akademik.program",
    type: "text",
  },
  Fakultas: {
    field: "akademik.fakultas",
    type: "text",
  },
  "Program Studi": {
    field: "akademik.program_studi",
    type: "text",
  },
  "Nomor SK Akreditasi": {
    field: "akademik.nomor_sk_akreditasi",
    type: "text",
  },
  Status: {
    field: "akademik.status_kelulusan",
    type: "text",
  },
  "Tanggal Lulus": {
    field: "akademik.tanggal_kelulusan_formatted",
    type: "text",
  },
  "Tabel Mata Kuliah": {
    field: "transkrip",
    type: "table",
    fontSize: 7,
  },
  "TTD Dekan": {
    field: "assets.ttd_dekan",
    type: "signature",
    roleLabel: "Dekan,",
  },
  "Nama Dekan": {
    field: "pejabat.nama_dekan",
    type: "text",
  },
  "NIDN Dekan": {
    field: "pejabat.nidn_dekan",
    type: "text",
  },
  "Paraf KATU Fakultas": {
    field: "assets.paraf_katu_fakultas",
    type: "image",
  },
  "Paraf Kaprodi": {
    field: "assets.paraf_kaprodi",
    type: "image",
  },
};

export function normalizeTemplateElement(
  element: TemplateElement,
  jenis: "ijazah" | "transkrip"
): NormalizedTemplateElement {
  const label = typeof element.label === "string" ? element.label : "";

  const mapping =
    jenis === "transkrip"
      ? TRANSKRIP_FIELD_MAP[label]
      : IJAZAH_FIELD_MAP[label];

  if (jenis === "transkrip" && label === "TTD Dekan") {
    return {
      ...element,
      field: element.field || mapping?.field,
      type: "signature",
      fontSize:
        Number(element.fontSize ?? mapping?.fontSize ?? 0) || undefined,
      fontWeight:
        typeof element.fontWeight === "string"
          ? element.fontWeight
          : mapping?.fontWeight,
      align:
        typeof element.align === "string"
          ? element.align
          : mapping?.align,
      roleLabel:
        typeof element.roleLabel === "string"
          ? element.roleLabel
          : mapping?.roleLabel || "Dekan,",
    };
  }

  return {
    ...element,

    // utama: ambil dari frontend
    field: element.field || mapping?.field,
    type: (element.type as ElementType) || mapping?.type || "text",

    // utama: ambil dari frontend
    fontSize:
      Number(element.fontSize ?? mapping?.fontSize ?? 0) || undefined,
    fontWeight:
      typeof element.fontWeight === "string"
        ? element.fontWeight
        : mapping?.fontWeight,
    align:
      typeof element.align === "string"
        ? element.align
        : mapping?.align,

    roleLabel:
      typeof element.roleLabel === "string"
        ? element.roleLabel
        : mapping?.roleLabel,
  };
}