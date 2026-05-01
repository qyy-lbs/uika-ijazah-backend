# PANDUAN INSTALASI INBOUND SERVICE
## Sistem Informasi Penerbitan Ijazah & Transkrip Digital

---

## PRASYARAT

Pastikan sudah terinstall di komputer kamu:
- **Node.js** versi 18 atau lebih baru → https://nodejs.org
- **npm** versi 9 atau lebih baru (sudah ikut bersama Node.js)
- Akses ke database **Neon PostgreSQL** (sudah ada di .env)
- **Postman** untuk testing endpoint

Cek versi Node.js:
```bash
node -v   # harus >= 18.x
npm -v    # harus >= 9.x
```

---

## LANGKAH 1 — Extract & Masuk Folder

Extract file ZIP, lalu masuk ke folder project:
```bash
cd inbound-service
```

---

## LANGKAH 2 — Install Dependencies

```bash
npm install
```

Ini akan menginstall semua package yang dibutuhkan termasuk:
- express, multer, xlsx, jsonwebtoken
- prisma, @prisma/client, @prisma/adapter-pg, pg
- typescript, ts-node, dan semua @types/*

---

## LANGKAH 3 — Buat File .env

Buat file `.env` di root folder project (sejajar dengan `package.json`):

```env
PORT=3002
DATABASE_URL="postgresql://neondb_owner:npg_n4fkcyZXH0EY@ep-noisy-union-aomnndsf-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="kuncirahasiauikajwtsecret123"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=10
```

> ⚠️ File .env tidak ikut di dalam ZIP karena berisi data sensitif.
> Buat manual sesuai contoh di atas.

---

## LANGKAH 4 — Generate Prisma Client

```bash
npx prisma generate --config prisma.config.ts
```

Perintah ini akan membuat Prisma Client berdasarkan schema yang ada
di `prisma/schema.prisma`. Harus dijalankan sekali setelah `npm install`.

---

## LANGKAH 5 — Push Schema ke Database

```bash
npx prisma db push --config prisma.config.ts
```

Perintah ini akan membuat semua tabel di database Neon sesuai schema Prisma.

> ✅ Kalau berhasil, output-nya seperti:
> ```
> Your database is now in sync with your Prisma schema.
> ```

> ⚠️ Kalau tabel sudah ada sebelumnya dan ada konflik, tambahkan flag:
> ```bash
> npx prisma db push --config prisma.config.ts --force-reset
> ```
> Hati-hati: `--force-reset` akan menghapus semua data yang ada.

---

## LANGKAH 6 — Jalankan Service

Mode development (dengan hot-reload otomatis via ts-node):
```bash
npm run dev
```

Output yang muncul kalau berhasil:
```
✅ Inbound Service berjalan di port 3002
   Health check: http://localhost:3002/health
```

---

## LANGKAH 7 — Verifikasi Service Berjalan

Buka browser atau Postman, akses:
```
GET http://localhost:3002/health
```

Response yang diharapkan:
```json
{
  "status": "ok",
  "service": "inbound-service",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## TESTING DI POSTMAN

### Setup Collection

1. Buka Postman
2. Buat Collection baru: **"Inbound Service"**
3. Buat Variable di Collection:
   - `base_url` = `http://localhost:3002`
   - `token` = (diisi setelah dapat token dari auth service)

### Cara Dapat Token (Sementara)

Karena auth service belum jalan, kamu bisa generate token JWT manual
untuk testing menggunakan script Node.js berikut:

```javascript
// generate-token.js — jalankan dengan: node generate-token.js
const jwt = require('jsonwebtoken');

const payload = {
  id_user: 1,
  email: "admin@uika.ac.id",
  role: "admin",       // bisa: admin, operator
  id_unit: 1
};

const token = jwt.sign(payload, "kuncirahasiauikajwtsecret123", {
  expiresIn: "24h"
});

console.log("Token:\n", token);
```

Jalankan di folder project:
```bash
node generate-token.js
```

Copy token yang muncul, lalu pakai sebagai Bearer Token di Postman.

---

### Daftar Endpoint & Cara Test di Postman

#### 1. Health Check
```
Method  : GET
URL     : {{base_url}}/health
Auth    : Tidak perlu
```

---

#### 2. Download Template Excel
```
Method  : GET
URL     : {{base_url}}/api/inbound/template
Auth    : Bearer Token
```
Response: File `.xlsx` akan langsung terdownload.
Di Postman klik **Send and Download** untuk menyimpan file-nya.

---

#### 3. Validasi Format File Excel (tanpa simpan ke DB)
```
Method  : POST
URL     : {{base_url}}/api/inbound/validasi-format
Auth    : Bearer Token
Body    : form-data
  - Key: file | Type: File | Value: [pilih file .xlsx kamu]
```

Response sukses (200):
```json
{
  "success": true,
  "message": "Format file valid.",
  "data": {
    "valid": true,
    "total_baris": 10
  }
}
```

Response gagal (422):
```json
{
  "success": false,
  "message": "Format file tidak valid.",
  "errors": {
    "kolom_tidak_ada": ["nim"],
    "total_baris": 0
  }
}
```

---

#### 4. Upload File Excel (import data mahasiswa)
```
Method  : POST
URL     : {{base_url}}/api/inbound/upload
Auth    : Bearer Token
Body    : form-data
  - Key: file        | Type: File   | Value: [pilih file .xlsx]
  - Key: periode     | Type: Text   | Value: semester genap
  - Key: tahun_lulus | Type: Text   | Value: 2025
  - Key: id_template | Type: Text   | Value: 1  (opsional)
```

Response sukses semua (201):
```json
{
  "success": true,
  "message": "Upload berhasil. 10 data mahasiswa berhasil diimport.",
  "data": {
    "id_batch_upload": 1,
    "nomor_batch_upload": "BATCH-20250101-AB12",
    "total_record": 10,
    "record_berhasil": 10,
    "record_gagal": 0,
    "errors": []
  }
}
```

Response partial / ada error baris (207):
```json
{
  "success": true,
  "message": "Upload selesai dengan 2 baris gagal diproses.",
  "data": {
    "record_berhasil": 8,
    "record_gagal": 2,
    "errors": [
      {
        "row": 3,
        "nim": "2021001003",
        "field": "email",
        "message": "Format email tidak valid."
      }
    ]
  }
}
```

---

#### 5. Riwayat Upload (list semua batch)
```
Method  : GET
URL     : {{base_url}}/api/inbound/riwayat
Auth    : Bearer Token
Query Params (opsional):
  - page        = 1
  - limit       = 10
  - tahun_lulus = 2025
  - periode     = semester genap
```

---

#### 6. Status Detail Batch Upload
```
Method  : GET
URL     : {{base_url}}/api/inbound/status/1
Auth    : Bearer Token
Param   : 1 = id_batch_upload
```

---

## FORMAT FILE EXCEL YANG DITERIMA

Download dulu template via endpoint `/api/inbound/template`,
lalu isi sesuai petunjuk berikut:

| Kolom            | Wajib | Contoh Isi               |
|------------------|-------|--------------------------|
| nim              | ✅    | 2021001001               |
| nama_mahasiswa   | ✅    | Budi Santoso             |
| nik              |       | 3201010101010001         |
| nomor_seri_ijazah|       | DN/2024/0001             |
| tempat_lahir     |       | Jakarta                  |
| tanggal_lahir    |       | 2000-01-15 atau 15/01/2000 |
| program          |       | S1                       |
| program_en       |       | Bachelor                 |
| gelar            |       | S.Kom.                   |
| gelar_en         |       | S.Kom.                   |
| jenis_kelamin    |       | Laki-laki / Perempuan    |
| telepon          |       | 08123456789              |
| email            |       | budi@email.com           |
| ipk              |       | 3.75                     |
| predikat         |       | Sangat Memuaskan         |
| judul_skripsi    |       | Analisis Sistem...       |
| tahun_masuk      |       | 2021                     |
| tahun_lulus      |       | 2025                     |
| status_kelulusan |       | Lulus                    |
| tanggal_kelulusan|       | 2025-02-10               |
| id_prodi         |       | 1                        |

> ⚠️ Nama header kolom harus persis seperti di atas (tidak case-sensitive).
> Jangan tambah atau ubah nama kolom di baris pertama.

---

## RBAC — HAK AKSES PER ROLE

| Endpoint              | admin | operator          |
|-----------------------|-------|-------------------|
| Download template     | ✅    | ✅                |
| Validasi format       | ✅    | ✅                |
| Upload file           | ✅    | ✅                |
| Riwayat upload        | ✅ semua | ✅ miliknya saja |
| Status batch          | ✅    | ✅                |

---

## STRUKTUR FOLDER PROJECT

```
inbound-service/
├── prisma/
│   └── schema.prisma          ← Skema database lengkap
├── src/
│   ├── config/
│   │   ├── app.ts             ← Load konfigurasi dari .env
│   │   └── prisma.ts          ← Prisma Client singleton (dengan adapter pg)
│   ├── types/
│   │   └── index.ts           ← TypeScript types & interfaces
│   ├── utils/
│   │   ├── response.ts        ← Helper sendSuccess / sendError
│   │   └── helpers.ts         ← generateNomorBatch, parseDate
│   ├── middlewares/
│   │   ├── auth.middleware.ts ← JWT verify + RBAC authorize()
│   │   ├── upload.middleware.ts ← Multer config (Excel only, max 10MB)
│   │   └── error.middleware.ts ← Global error handler
│   ├── services/
│   │   ├── excel.service.ts   ← Parser SheetJS + validasi baris
│   │   └── inbound.service.ts ← Business logic semua fitur
│   ├── controllers/
│   │   └── inbound.controller.ts ← Handler request & response
│   ├── routes/
│   │   └── inbound.routes.ts  ← Definisi route & middleware chain
│   └── index.ts               ← Entry point Express app
├── uploads/                   ← File Excel yang diupload (auto-created)
├── templates/                 ← (reserved untuk template statis)
├── .env                       ← ⚠️ Buat manual, tidak ada di ZIP
├── .gitignore
├── prisma.config.ts           ← Konfigurasi Prisma 7 (datasource URL)
├── tsconfig.json
├── package.json
└── PANDUAN_INSTALASI.md       ← File ini
```

---

## SCRIPTS NPM

| Script                  | Perintah                  | Fungsi                            |
|-------------------------|---------------------------|-----------------------------------|
| `npm run dev`           | ts-node src/index.ts      | Jalankan service (development)    |
| `npm run build`         | tsc                       | Kompilasi TypeScript → JavaScript |
| `npm run start`         | node dist/index.js        | Jalankan hasil build (production) |
| `npm run prisma:generate` | prisma generate         | Generate Prisma Client            |
| `npm run prisma:push`   | prisma db push            | Sinkronisasi schema ke database   |
| `npm run prisma:migrate` | prisma migrate dev       | Buat migration file               |
| `npm run prisma:studio` | prisma studio             | Buka Prisma Studio (GUI DB)       |

---

## TROUBLESHOOTING

### Error: Cannot find module '@prisma/client'
```bash
npx prisma generate --config prisma.config.ts
```

### Error: SSL connection required
Pastikan `DATABASE_URL` di `.env` mengandung `?sslmode=require`.

### Error: Port 3002 already in use
Ganti `PORT` di `.env` ke port lain, misalnya `3003`.

### Error: JWT token tidak valid saat testing
Pastikan `JWT_SECRET` di `.env` sama persis dengan yang dipakai auth service.
Generate ulang token dengan script `generate-token.js` di atas.

### File Excel ditolak (format error)
- Pastikan ekstensi file `.xlsx` atau `.xls`
- Pastikan kolom `nim` dan `nama_mahasiswa` ada di baris pertama
- Download template dari endpoint `/api/inbound/template` sebagai acuan
