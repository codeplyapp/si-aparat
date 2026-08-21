-- CreateEnum
CREATE TYPE "StatusMatriks" AS ENUM ('PRIORITAS_UTAMA', 'ADVOKASI', 'DELEGASI_OSIS', 'ARSIP');

-- AlterTable
ALTER TABLE "laporan" ADD COLUMN     "catatanTindakLanjut" TEXT,
ADD COLUMN     "isMelanggarAturan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matriksUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "skorDampak" INTEGER,
ADD COLUMN     "skorKelayakan" INTEGER,
ADD COLUMN     "statusMatriks" "StatusMatriks";

-- CreateIndex
CREATE INDEX "laporan_statusMatriks_idx" ON "laporan"("statusMatriks");
