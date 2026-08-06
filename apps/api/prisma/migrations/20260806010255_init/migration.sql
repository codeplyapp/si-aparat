-- CreateEnum
CREATE TYPE "RoleUser" AS ENUM ('SUPER_ADMIN', 'MPK', 'PEMBINA');

-- CreateEnum
CREATE TYPE "KategoriLaporan" AS ENUM ('SARANA', 'KEGIATAN', 'PERUNDUNGAN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusLaporan" AS ENUM ('BARU', 'DIPROSES', 'DITERUSKAN', 'SELESAI');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "RoleUser" NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan" (
    "id" TEXT NOT NULL,
    "kodeTracking" TEXT NOT NULL,
    "kategori" "KategoriLaporan" NOT NULL,
    "konten" TEXT NOT NULL,
    "status" "StatusLaporan" NOT NULL DEFAULT 'BARU',
    "isEskalasi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lampiran_foto" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lampiran_foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balasan_mpk" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balasan_mpk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catatan_pembina" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "catatan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catatan_pembina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_kodeTracking_key" ON "laporan"("kodeTracking");

-- CreateIndex
CREATE INDEX "laporan_status_idx" ON "laporan"("status");

-- CreateIndex
CREATE INDEX "laporan_kategori_idx" ON "laporan"("kategori");

-- CreateIndex
CREATE INDEX "laporan_isEskalasi_idx" ON "laporan"("isEskalasi");

-- CreateIndex
CREATE INDEX "laporan_createdAt_idx" ON "laporan"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "lampiran_foto_r2Key_key" ON "lampiran_foto"("r2Key");

-- CreateIndex
CREATE INDEX "lampiran_foto_laporanId_idx" ON "lampiran_foto"("laporanId");

-- CreateIndex
CREATE UNIQUE INDEX "balasan_mpk_laporanId_key" ON "balasan_mpk"("laporanId");

-- AddForeignKey
ALTER TABLE "lampiran_foto" ADD CONSTRAINT "lampiran_foto_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balasan_mpk" ADD CONSTRAINT "balasan_mpk_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balasan_mpk" ADD CONSTRAINT "balasan_mpk_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_pembina" ADD CONSTRAINT "catatan_pembina_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catatan_pembina" ADD CONSTRAINT "catatan_pembina_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
