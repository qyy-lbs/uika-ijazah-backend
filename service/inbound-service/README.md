# Inbound Service — Sistem Informasi Penerbitan Ijazah & Transkrip Digital

## Stack
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL (Neon)
- SheetJS (xlsx) untuk parsing Excel
- JWT untuk autentikasi

## Setup

```bash
npm install
npx prisma generate
npm run dev
```

## Environment Variables

```
PORT=3002
DATABASE_URL=...
JWT_SECRET=...
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

---

## Endpoint API

### Base URL: `http://localhost:3002`

Semua endpoint (kecuali `/health`) memerlukan header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### GET /health
Health check service.

**Response:**
```json
{
  "status": "ok",
  "service": "inbound-service",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### GET /api/inbound/template
Download template Excel kosong.

- **Auth:** Required (semua role)
- **Response:** File `.xlsx` (download)

---

### POST /api/inbound/validasi-format
Validasi format file Excel **tanpa** menyimpan ke database.

- **Auth:** Required (admin, operator)
- **Body:** `multipart/form-data`
  - `file` — file Excel (.xlsx / .xls)

**Response sukses (200):**
```json
{
  "success": true,
  "message": "Format file valid.",
  "data": {
    "valid": true,
    "total_baris": 50
  }
}
```

**Response gagal (422):**
```json
{
  "success": false,
  "message": "Format file tidak valid.",
  "errors": {
    "kolom_tidak_ada": ["nim", "nama_mahasiswa"],
    "total_baris": 0
  }
}
```

---

### POST /api/inbound/upload
Upload file Excel dan import data mahasiswa ke database.

- **Auth:** Required (admin, operator)
- **Body:** `multipart/form-data`
  - `file` — file Excel (.xlsx / .xls)
  - `periode` — `"semester ganjil"` atau `"semester genap"`
  - `tahun_lulus` — angka, contoh: `2025`
  - `id_template` *(opsional)* — ID template dokumen

**Response sukses (201):**
```json
{
  "success": true,
  "message": "Upload berhasil. 45 data mahasiswa berhasil diimport.",
  "data": {
    "id_batch_upload": 1,
    "uuid": "...",
    "nomor_batch_upload": "BATCH-20250101-AB12",
    "nama_file": "data_mahasiswa.xlsx",
    "total_record": 45,
    "record_berhasil": 45,
    "record_gagal": 0,
    "errors": []
  }
}
```

**Response partial (207) — ada baris gagal:**
```json
{
  "success": true,
  "message": "Upload selesai dengan 3 baris gagal diproses.",
  "data": {
    "record_berhasil": 42,
    "record_gagal": 3,
    "errors": [
      { "row": 5, "nim": "2021001005", "field": "email", "message": "Format email tidak valid." }
    ]
  }
}
```

---

### GET /api/inbound/status/:id
Detail status satu batch upload.

- **Auth:** Required (admin, operator)
- **Param:** `id` — `id_batch_upload`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id_batch_upload": 1,
    "nomor_batch_upload": "BATCH-20250101-AB12",
    "nama_file": "data_mahasiswa.xlsx",
    "total_record": 45,
    "record_berhasil": 45,
    "record_gagal": 0,
    "periode": "semester genap",
    "tahun_lulus": 2025,
    "log_error": [],
    "users": { "id_user": 1, "email": "admin@uika.ac.id", "role": "admin" },
    "mahasiswa": [...]
  }
}
```

---

### GET /api/inbound/riwayat
Riwayat semua batch upload dengan pagination.

- **Auth:** Required (admin: semua, operator: miliknya saja)
- **Query params:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `tahun_lulus` *(opsional)*
  - `periode` *(opsional)*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

---

## Format File Excel

Header kolom yang dikenali (nama harus persis, tidak case-sensitive):

| Kolom | Wajib | Keterangan |
|---|---|---|
| nim | ✅ | NIM mahasiswa (unik) |
| nama_mahasiswa | ✅ | Nama lengkap |
| nik | — | NIK |
| nomor_seri_ijazah | — | No seri ijazah |
| pisn | — | PISN |
| tempat_lahir | — | |
| tanggal_lahir | — | Format: YYYY-MM-DD atau DD/MM/YYYY |
| program | — | Contoh: S1 |
| program_en | — | Contoh: Bachelor |
| gelar | — | Contoh: S.Kom. |
| gelar_en | — | |
| jenis_kelamin | — | Laki-laki / Perempuan |
| telepon | — | |
| email | — | Harus format email valid |
| ipk | — | Angka 0.00 - 4.00 |
| predikat | — | |
| judul_skripsi | — | |
| tahun_masuk | — | Angka tahun |
| tahun_lulus | — | Angka tahun |
| status_kelulusan | — | |
| tanggal_kelulusan | — | Format: YYYY-MM-DD atau DD/MM/YYYY |
| id_prodi | — | ID program studi di database |

---

## RBAC Roles

| Role | Upload | Validasi | Riwayat | Status |
|---|---|---|---|---|
| admin | ✅ semua | ✅ | ✅ semua | ✅ |
| operator | ✅ | ✅ | ✅ miliknya | ✅ |
