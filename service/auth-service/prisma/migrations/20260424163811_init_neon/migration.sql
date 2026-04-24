-- CreateEnum
CREATE TYPE "periode_enum" AS ENUM ('semester ganjil', 'semester genap');

-- CreateEnum
CREATE TYPE "jenis_dokumen_enum" AS ENUM ('ijazah', 'transkrip');

-- CreateEnum
CREATE TYPE "jenis_template_enum" AS ENUM ('ijazah', 'transkrip');

-- CreateEnum
CREATE TYPE "jenis_unit_enum" AS ENUM ('universitas', 'fakultas');

-- CreateTable
CREATE TABLE "akademik" (
    "id_akademik" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_prodi" INTEGER,
    "kode_matkul" VARCHAR(20),
    "nama_matkul" VARCHAR(100),
    "bobot_k" INTEGER,
    "bobot_t" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "akademik_pkey" PRIMARY KEY ("id_akademik")
);

-- CreateTable
CREATE TABLE "batch_upload" (
    "id_batch_upload" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_template" INTEGER,
    "nomor_batch_upload" VARCHAR(50),
    "nama_file" VARCHAR(100),
    "total_record" INTEGER,
    "record_berhasil" INTEGER,
    "record_gagal" INTEGER,
    "uploaded_by" INTEGER,
    "periode" "periode_enum",
    "tahun_lulus" INTEGER,
    "log_error" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_upload_pkey" PRIMARY KEY ("id_batch_upload")
);

-- CreateTable
CREATE TABLE "blockchain" (
    "id_blockchain" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_dokumen" INTEGER,
    "hash_dokumen" TEXT,
    "index_block" INTEGER,
    "hash_block" TEXT,
    "previous_hash" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_pkey" PRIMARY KEY ("id_blockchain")
);

-- CreateTable
CREATE TABLE "dokumen" (
    "id_dokumen" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_mahasiswa" INTEGER,
    "id_template" INTEGER,
    "jenis_dokumen" "jenis_dokumen_enum" NOT NULL,
    "nomor_dokumen" VARCHAR(50),
    "tanggal_terbit" DATE,
    "is_verified" BOOLEAN DEFAULT false,
    "file_pdf" TEXT,
    "file_pdf_final" TEXT,
    "kode_qr" TEXT,
    "url_akses" TEXT,
    "download_count" INTEGER DEFAULT 0,
    "max_download" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dokumen_pkey" PRIMARY KEY ("id_dokumen")
);

-- CreateTable
CREATE TABLE "log_aktivitas" (
    "id_log" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_user" INTEGER,
    "aktivitas" VARCHAR(50),
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_aktivitas_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id_mahasiswa" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_prodi" INTEGER,
    "id_batch_upload" INTEGER,
    "nim" VARCHAR(20) NOT NULL,
    "nik" VARCHAR(50),
    "nomor_seri_ijazah" VARCHAR(50),
    "pisn" VARCHAR(50),
    "nama_mahasiswa" VARCHAR(100),
    "tempat_lahir" VARCHAR(50),
    "tanggal_lahir" DATE,
    "program" VARCHAR(20),
    "program_en" VARCHAR(20),
    "gelar" VARCHAR(100),
    "gelar_en" VARCHAR(100),
    "jenis_kelamin" VARCHAR(20),
    "telepon" VARCHAR(20),
    "email" VARCHAR(100),
    "foto" TEXT,
    "ipk" DECIMAL(3,2),
    "predikat" VARCHAR(50),
    "judul_skripsi" TEXT,
    "tahun_masuk" INTEGER,
    "tahun_lulus" INTEGER,
    "status_kelulusan" VARCHAR(50),
    "tanggal_kelulusan" DATE,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("id_mahasiswa")
);

-- CreateTable
CREATE TABLE "nilai" (
    "id_nilai" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_mahasiswa" INTEGER,
    "id_akademik" INTEGER,
    "nilai_huruf" VARCHAR(5),
    "nilai_angka" DECIMAL(3,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nilai_pkey" PRIMARY KEY ("id_nilai")
);

-- CreateTable
CREATE TABLE "template" (
    "id_template" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "jenis_template" "jenis_template_enum" NOT NULL,
    "file_template" TEXT,
    "konfigurasi_layout" JSONB,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_pkey" PRIMARY KEY ("id_template")
);

-- CreateTable
CREATE TABLE "unit" (
    "id_unit" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "parent_id" INTEGER,
    "jenis_unit" "jenis_unit_enum" NOT NULL,
    "nama_unit" VARCHAR(100) NOT NULL,
    "nama_unit_en" VARCHAR(100),
    "akreditasi_aipt" VARCHAR(50),
    "rektor" VARCHAR(100),
    "nidn_rektor" VARCHAR(50),
    "wakil_rektor_1" VARCHAR(100),
    "nidn_wakil_rektor_1" VARCHAR(50),
    "tu_rektorat" VARCHAR(100),
    "file_ttd_rektor" TEXT,
    "file_paraf_warek" TEXT,
    "file_paraf_tu_rektorat" TEXT,
    "file_stempel_universitas" TEXT,
    "dekan" VARCHAR(100),
    "nidn_dekan" VARCHAR(50),
    "wakil_dekan_1" VARCHAR(100),
    "nidn_wakil_dekan_1" VARCHAR(50),
    "tu_fakultas" VARCHAR(100),
    "file_ttd_dekan" TEXT,
    "file_paraf_wadek" TEXT,
    "file_paraf_tu_fakultas" TEXT,
    "file_stempel_fakultas" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id_unit")
);

-- CreateTable
CREATE TABLE "users" (
    "id_user" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_unit" INTEGER,
    "email" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "role" VARCHAR(20),
    "is_active" BOOLEAN DEFAULT true,
    "last_login" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "validasi" (
    "id_validasi" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_mahasiswa" INTEGER,
    "validated_by" INTEGER,
    "status_validasi" VARCHAR(20),
    "level_validasi" INTEGER NOT NULL,
    "catatan" TEXT,
    "validated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validasi_pkey" PRIMARY KEY ("id_validasi")
);

-- CreateTable
CREATE TABLE "prodi" (
    "id_prodi" SERIAL NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "id_unit" INTEGER,
    "nama_prodi" VARCHAR(100) NOT NULL,
    "nama_prodi_en" VARCHAR(100),
    "kaprodi" VARCHAR(100),
    "nidn_kaprodi" VARCHAR(30),
    "file_paraf_kaprodi" TEXT,
    "no_sk_akreditasi" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prodi_pkey" PRIMARY KEY ("id_prodi")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_id_dokumen_key" ON "blockchain"("id_dokumen");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mahasiswa_nim" ON "mahasiswa"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mahasiswa_nik" ON "mahasiswa"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mahasiswa_no_ijazah" ON "mahasiswa"("nomor_seri_ijazah");

-- CreateIndex
CREATE UNIQUE INDEX "uq_nilai_mhs_matkul" ON "nilai"("id_mahasiswa", "id_akademik");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_validasi_mahasiswa_level" ON "validasi"("id_mahasiswa", "level_validasi");

-- AddForeignKey
ALTER TABLE "akademik" ADD CONSTRAINT "akademik_id_prodi_fkey" FOREIGN KEY ("id_prodi") REFERENCES "prodi"("id_prodi") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "batch_upload" ADD CONSTRAINT "batch_upload_id_template_fkey" FOREIGN KEY ("id_template") REFERENCES "template"("id_template") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "batch_upload" ADD CONSTRAINT "batch_upload_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blockchain" ADD CONSTRAINT "blockchain_id_dokumen_fkey" FOREIGN KEY ("id_dokumen") REFERENCES "dokumen"("id_dokumen") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "mahasiswa"("id_mahasiswa") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_id_template_fkey" FOREIGN KEY ("id_template") REFERENCES "template"("id_template") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_aktivitas" ADD CONSTRAINT "log_aktivitas_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_id_batch_upload_fkey" FOREIGN KEY ("id_batch_upload") REFERENCES "batch_upload"("id_batch_upload") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_id_prodi_fkey" FOREIGN KEY ("id_prodi") REFERENCES "prodi"("id_prodi") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_id_akademik_fkey" FOREIGN KEY ("id_akademik") REFERENCES "akademik"("id_akademik") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "mahasiswa"("id_mahasiswa") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "unit"("id_unit") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_unit_fkey" FOREIGN KEY ("id_unit") REFERENCES "unit"("id_unit") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validasi" ADD CONSTRAINT "validasi_id_mahasiswa_fkey" FOREIGN KEY ("id_mahasiswa") REFERENCES "mahasiswa"("id_mahasiswa") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validasi" ADD CONSTRAINT "validasi_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "prodi" ADD CONSTRAINT "prodi_id_unit_fkey" FOREIGN KEY ("id_unit") REFERENCES "unit"("id_unit") ON DELETE CASCADE ON UPDATE NO ACTION;
