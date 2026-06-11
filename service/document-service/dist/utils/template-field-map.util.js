function normalizeTextDecoration(value, fallback) {
    if (value === "underline" || value === "none") {
        return value;
    }
    if (fallback === "underline" || fallback === "none") {
        return fallback;
    }
    return "none";
}
function normalizeFontStyle(value, fallback) {
    if (value === "italic" || value === "normal") {
        return value;
    }
    if (fallback === "italic" || fallback === "normal") {
        return fallback;
    }
    return "normal";
}
const DEFAULT_TEXT_STYLE = {
    fontFamily: "Times New Roman",
    fontWeight: "400",
    align: "center",
};
const IJAZAH_FIELD_MAP = {
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
const TRANSKRIP_FIELD_MAP = {
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
        fontFamily: "Times New Roman",
        fontWeight: "500",
        align: "left",
    },
    "TTD Dekan": {
        field: "assets.ttd_dekan",
        type: "signature",
        roleLabel: "Dekan,",
        fontSize: 8,
        fontFamily: "Times New Roman",
        fontWeight: "600",
        align: "center",
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
function normalizeFontSize(value, fallback) {
    const parsed = Number(value ?? fallback ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
function normalizeFontFamily(value, fallback) {
    if (typeof value === "string" && value.trim()) {
        return value;
    }
    if (typeof fallback === "string" && fallback.trim()) {
        return fallback;
    }
    return DEFAULT_TEXT_STYLE.fontFamily;
}
function normalizeFontWeight(value, fallback) {
    if (typeof value === "string" && value.trim()) {
        return value;
    }
    if (typeof fallback === "string" && fallback.trim()) {
        return fallback;
    }
    return DEFAULT_TEXT_STYLE.fontWeight;
}
function normalizeAlign(value, fallback) {
    if (value === "left" || value === "center" || value === "right") {
        return value;
    }
    if (fallback === "left" || fallback === "center" || fallback === "right") {
        return fallback;
    }
    return DEFAULT_TEXT_STYLE.align;
}
function normalizeRoleLabel(value, fallback) {
    if (typeof value === "string" && value.trim()) {
        return value;
    }
    if (typeof fallback === "string" && fallback.trim()) {
        return fallback;
    }
    return undefined;
}
export function normalizeTemplateElement(element, jenis) {
    const label = typeof element.label === "string" ? element.label : "";
    const mapping = jenis === "transkrip"
        ? TRANSKRIP_FIELD_MAP[label]
        : IJAZAH_FIELD_MAP[label];
    const resolvedType = jenis === "transkrip" && label === "TTD Dekan"
        ? "signature"
        : (element.type || mapping?.type || "text");
    return {
        ...element,
        // Prioritas utama dari frontend/database.
        // Kalau kosong, baru fallback ke mapping.
        field: element.field || mapping?.field,
        type: resolvedType,
        fontSize: normalizeFontSize(element.fontSize, mapping?.fontSize),
        fontFamily: normalizeFontFamily(element.fontFamily, mapping?.fontFamily),
        fontWeight: normalizeFontWeight(element.fontWeight, mapping?.fontWeight),
        fontStyle: normalizeFontStyle(element.fontStyle, mapping?.fontStyle),
        textDecoration: normalizeTextDecoration(element.textDecoration, mapping?.textDecoration),
        align: normalizeAlign(element.align, mapping?.align),
        roleLabel: normalizeRoleLabel(element.roleLabel, mapping?.roleLabel),
    };
}
//# sourceMappingURL=template-field-map.util.js.map