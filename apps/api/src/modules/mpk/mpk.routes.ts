/**
 * Module: MPK Dashboard
 * Semua route membutuhkan role MPK atau SUPER_ADMIN
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  StatusLaporan,
  StatusMatriks,
  KategoriLaporan,
  hitungStatusMatriks,
  KATEGORI_LABELS,
  STATUS_MATRIKS_LABELS,
} from '@si-aparat/shared';
import { requireMPK, JwtPayload } from '../../middleware/auth';
import { decryptText } from '../../lib/crypto';
import { getPresignedDownloadUrl } from '../../lib/storage';

const prisma = new PrismaClient();

const updateStatusSchema = z.object({
  status: z.nativeEnum(StatusLaporan),
});

const updateMatriksSchema = z.object({
  skorDampak: z.number().int().min(1).max(4).nullable().optional(),
  skorKelayakan: z.number().int().min(1).max(4).nullable().optional(),
  isMelanggarAturan: z.boolean().optional(),
  statusMatriks: z.nativeEnum(StatusMatriks).nullable().optional(),
  catatanTindakLanjut: z.string().max(2000).nullable().optional(),
});

const balasanSchema = z.object({
  pesan: z.string().min(1).max(500),
});

export async function mpkRoutes(fastify: FastifyInstance) {
  // Terapkan auth untuk semua route di modul ini
  fastify.addHook('preHandler', requireMPK);

  // ─── GET /api/v1/mpk/laporan ──────────────────────────────────────
  fastify.get('/laporan', async (_request: FastifyRequest, reply: FastifyReply) => {
    const { status, kategori, statusMatriks, page = '1', limit = '100' } = _request.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status && status !== 'undefined') where.status = status;
    if (kategori && kategori !== 'undefined') where.kategori = kategori;
    if (statusMatriks && statusMatriks !== 'undefined') {
      if (statusMatriks === 'BELUM_DINILAI') {
        where.statusMatriks = null;
      } else {
        where.statusMatriks = statusMatriks;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [laporan, totalFiltered, totalAll, baruAll, perundunganAll] = await Promise.all([
      prisma.laporan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          kodeTracking: true,
          kategori: true,
          status: true,
          isEskalasi: true,
          skorDampak: true,
          skorKelayakan: true,
          isMelanggarAturan: true,
          statusMatriks: true,
          catatanTindakLanjut: true,
          matriksUpdatedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { lampiran: true } },
        },
      }),
      prisma.laporan.count({ where }),
      prisma.laporan.count(),
      prisma.laporan.count({ where: { status: StatusLaporan.BARU } }),
      prisma.laporan.count({ where: { kategori: KategoriLaporan.PERUNDUNGAN } }),
    ]);

    return reply.send({
      data: laporan,
      pagination: { total: totalFiltered, page: Number(page), limit: Number(limit) },
      stats: {
        total: totalAll,
        baru: baruAll,
        perundungan: perundunganAll,
      },
    });
  });

  // ─── GET /api/v1/mpk/export/matriks.csv ───────────────────────────
  fastify.get('/export/matriks.csv', async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, kategori, statusMatriks } = request.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status && status !== 'undefined') where.status = status;
    if (kategori && kategori !== 'undefined') where.kategori = kategori;
    if (statusMatriks && statusMatriks !== 'undefined') {
      if (statusMatriks === 'BELUM_DINILAI') {
        where.statusMatriks = null;
      } else {
        where.statusMatriks = statusMatriks;
      }
    }

    const laporanList = await prisma.laporan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        kodeTracking: true,
        createdAt: true,
        konten: true,
        kategori: true,
        skorDampak: true,
        skorKelayakan: true,
        statusMatriks: true,
        catatanTindakLanjut: true,
      },
    });

    const escapeCsvCell = (value: unknown): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows: string[] = [
      // Header row (UTF-8 BOM + Delimiter ;)
      [
        'ID Aspirasi',
        'Tanggal',
        'Rincian',
        'Kategori',
        'Skor Dampak',
        'Skor Kelayakan',
        'Status Final',
        'Catatan & Tindak Lanjut',
      ].map(escapeCsvCell).join(';'),
    ];

    for (const item of laporanList) {
      let isiDecrypted: string;
      try {
        isiDecrypted = decryptText(item.konten);
      } catch {
        isiDecrypted = '[Gagal mendekripsi konten]';
      }

      const tanggal = item.createdAt.toISOString().split('T')[0];
      const kategoriLabel = KATEGORI_LABELS[item.kategori as KategoriLaporan] || item.kategori;
      const statusFinalLabel = item.statusMatriks
        ? STATUS_MATRIKS_LABELS[item.statusMatriks as StatusMatriks] || item.statusMatriks
        : 'Belum Dinilai';

      const row = [
        item.kodeTracking,
        tanggal,
        isiDecrypted,
        kategoriLabel,
        item.skorDampak !== null && item.skorDampak !== undefined ? item.skorDampak : '-',
        item.skorKelayakan !== null && item.skorKelayakan !== undefined ? item.skorKelayakan : '-',
        statusFinalLabel,
        item.catatanTindakLanjut || '-',
      ].map(escapeCsvCell).join(';');

      rows.push(row);
    }

    // UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + rows.join('\r\n');

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="matriks-penilaian-aspirasi.csv"')
      .send(csvContent);
  });

  // ─── GET /api/v1/mpk/laporan/:id ─────────────────────────────────
  fastify.get(
    '/laporan/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const laporan = await prisma.laporan.findUnique({
        where: { id: request.params.id },
        include: {
          lampiran: true,
          balasan: true,
          catatan: { include: { author: { select: { namaLengkap: true, role: true } } } },
        },
      });

      if (!laporan) {
        return reply.status(404).send({ error: 'Not Found', message: 'Laporan tidak ditemukan.' });
      }

      // Dekripsi konten di sini (hanya untuk user terautentikasi)
      let kontenDecrypted: string;
      try {
        kontenDecrypted = decryptText(laporan.konten);
      } catch {
        kontenDecrypted = '[Gagal mendekripsi konten laporan]';
      }

      // Generate presigned URLs untuk foto (15 menit TTL)
      const lampiranWithUrls = await Promise.all(
        laporan.lampiran.map(async (foto) => ({
          id: foto.id,
          mimeType: foto.mimeType,
          fileSizeBytes: foto.fileSizeBytes,
          downloadUrl: await getPresignedDownloadUrl(foto.r2Key),
        })),
      );

      return reply.send({
        ...laporan,
        konten: kontenDecrypted,
        lampiran: lampiranWithUrls,
      });
    },
  );

  // ─── PATCH /api/v1/mpk/laporan/:id/status ────────────────────────
  fastify.patch(
    '/laporan/:id/status',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', message: 'Status tidak valid.' });
      }

      const laporan = await prisma.laporan.update({
        where: { id: request.params.id },
        data: { status: parsed.data.status },
        select: { id: true, kodeTracking: true, status: true },
      });

      return reply.send({ message: 'Status laporan berhasil diperbarui.', laporan });
    },
  );

  // ─── PATCH /api/v1/mpk/laporan/:id/matriks ───────────────────────
  fastify.patch(
    '/laporan/:id/matriks',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const parsed = updateMatriksSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Data penilaian matriks tidak valid.',
          details: parsed.error.format(),
        });
      }

      const existing = await prisma.laporan.findUnique({
        where: { id: request.params.id },
        select: { id: true, kategori: true },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Not Found', message: 'Laporan tidak ditemukan.' });
      }

      const isMelanggarAturan = parsed.data.isMelanggarAturan ?? false;
      const skorDampak = parsed.data.skorDampak ?? null;
      const skorKelayakan = parsed.data.skorKelayakan ?? null;
      const catatanTindakLanjut = parsed.data.catatanTindakLanjut ?? null;

      let statusMatriks: StatusMatriks | null = null;
      if (isMelanggarAturan) {
        statusMatriks = StatusMatriks.ARSIP;
      } else if (parsed.data.statusMatriks !== undefined) {
        statusMatriks = parsed.data.statusMatriks;
      } else {
        statusMatriks = hitungStatusMatriks({
          kategori: existing.kategori as KategoriLaporan,
          isMelanggarAturan,
          skorDampak,
          skorKelayakan,
        });
      }

      const updated = await prisma.laporan.update({
        where: { id: request.params.id },
        data: {
          skorDampak,
          skorKelayakan,
          isMelanggarAturan,
          statusMatriks,
          catatanTindakLanjut,
          matriksUpdatedAt: new Date(),
        },
        select: {
          id: true,
          kodeTracking: true,
          kategori: true,
          status: true,
          skorDampak: true,
          skorKelayakan: true,
          isMelanggarAturan: true,
          statusMatriks: true,
          catatanTindakLanjut: true,
          matriksUpdatedAt: true,
        },
      });

      return reply.send({
        message: 'Penilaian matriks berhasil disimpan.',
        laporan: updated,
      });
    },
  );

  // ─── POST /api/v1/mpk/laporan/:id/eskalasi ───────────────────────
  fastify.post(
    '/laporan/:id/eskalasi',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const laporan = await prisma.laporan.update({
        where: { id: request.params.id },
        data: {
          isEskalasi: true,
          status: StatusLaporan.DITERUSKAN,
        },
        select: { id: true, kodeTracking: true, status: true, isEskalasi: true },
      });

      return reply.send({ message: 'Laporan berhasil diteruskan ke Pembina.', laporan });
    },
  );

  // ─── POST /api/v1/mpk/laporan/:id/balasan ────────────────────────
  fastify.post(
    '/laporan/:id/balasan',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const payload = request.user as JwtPayload;

      const parsed = balasanSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', message: 'Pesan balasan tidak valid.' });
      }

      const balasan = await prisma.balasanMPK.upsert({
        where: { laporanId: request.params.id },
        create: {
          laporanId: request.params.id,
          authorId: payload.sub,
          pesan: parsed.data.pesan,
        },
        update: {
          pesan: parsed.data.pesan,
          authorId: payload.sub,
        },
      });

      return reply.status(201).send({ message: 'Balasan berhasil dikirim.', balasan });
    },
  );
}
