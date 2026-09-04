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
  RoleUser,
  hitungStatusMatriks,
  KATEGORI_LABELS,
  STATUS_MATRIKS_LABELS,
} from '@si-aparat/shared';
import { requireMPK, JwtPayload } from '../../middleware/auth';
import { decryptText, decryptBuffer } from '../../lib/crypto';
import { downloadEncryptedFile } from '../../lib/storage';
import { cacheGet, cacheSet, cacheInvalidateKey, cacheInvalidatePattern } from '../../lib/cache';

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
  // ─── GET /api/v1/mpk/foto/:fotoId (Streaming Dekripsi Foto) ────────
  // Mendukung query token ?token= agar dapat dibuka langsung via <a> / <img>
  fastify.get(
    '/foto/:fotoId',
    async (
      request: FastifyRequest<{ Params: { fotoId: string }; Querystring: { token?: string } }>,
      reply: FastifyReply,
    ) => {
      const token =
        request.headers.authorization?.replace(/^Bearer\s+/i, '') ||
        (request.query as { token?: string })?.token;

      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Token autentikasi diperlukan.' });
      }

      try {
        const decoded = fastify.jwt.verify<JwtPayload>(token);
        if (
          decoded.role !== RoleUser.MPK &&
          decoded.role !== RoleUser.SUPER_ADMIN &&
          decoded.role !== RoleUser.PEMBINA
        ) {
          return reply.status(403).send({ error: 'Forbidden', message: 'Akses ditolak.' });
        }
      } catch {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Token tidak valid atau kedaluwarsa.' });
      }

      const foto = await prisma.lampiranFoto.findUnique({
        where: { id: request.params.fotoId },
      });

      if (!foto) {
        return reply.status(404).send({ error: 'Not Found', message: 'Foto bukti tidak ditemukan.' });
      }

      try {
        const encryptedBuffer = await downloadEncryptedFile(foto.r2Key);
        const decryptedBuffer = decryptBuffer(encryptedBuffer);

        return reply
          .header('Content-Type', foto.mimeType)
          .header('Content-Disposition', `inline; filename="bukti-${foto.id}.${foto.mimeType.split('/')[1] || 'jpg'}"`)
          .header('Cache-Control', 'private, max-age=3600')
          .send(decryptedBuffer);
      } catch (err: any) {
        fastify.log.error(err, 'Failed to download or decrypt foto');
        return reply.status(500).send({ error: 'Internal Server Error', message: 'Gagal memproses foto bukti.' });
      }
    },
  );

  // Terapkan auth untuk route lainnya di modul ini
  fastify.addHook('preHandler', requireMPK);

  // ─── GET /api/v1/mpk/laporan ──────────────────────────────────────
  fastify.get('/laporan', async (_request: FastifyRequest, reply: FastifyReply) => {
    const { status, kategori, statusMatriks, page = '1', limit = '100' } = _request.query as Record<string, string>;

    // ── Cache key unik per kombinasi filter ───────────────────────────
    const cacheKey = `laporan:mpk:list:${status ?? ''}:${kategori ?? ''}:${statusMatriks ?? ''}:${page}:${limit}`;
    const cached = await cacheGet<object>(cacheKey);
    if (cached) return reply.send(cached);

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

    const responseBody = {
      data: laporan,
      pagination: { total: totalFiltered, page: Number(page), limit: Number(limit) },
      stats: {
        total: totalAll,
        baru: baruAll,
        perundungan: perundunganAll,
      },
    };

    // Cache selama 60 detik
    await cacheSet(cacheKey, responseBody, 60);

    return reply.send(responseBody);
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
      const { id } = request.params;
      const cacheKey = `laporan:mpk:detail:${id}`;

      const cached = await cacheGet<object>(cacheKey);
      if (cached) return reply.send(cached);

      const laporan = await prisma.laporan.findUnique({
        where: { id },
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

      // Generate route streaming URLs untuk foto terdekripsi
      const lampiranWithUrls = laporan.lampiran.map((foto) => ({
        id: foto.id,
        mimeType: foto.mimeType,
        fileSizeBytes: foto.fileSizeBytes,
        downloadUrl: `/api/v1/mpk/foto/${foto.id}`,
      }));

      const responseBody = {
        ...laporan,
        konten: kontenDecrypted,
        lampiran: lampiranWithUrls,
      };

      // Cache detail laporan selama 5 menit
      await cacheSet(cacheKey, responseBody, 300);

      return reply.send(responseBody);
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

      // Invalidasi cache laporan yang diubah
      await Promise.all([
        cacheInvalidateKey(`laporan:mpk:detail:${request.params.id}`),
        cacheInvalidatePattern('laporan:mpk:list:*'),
      ]);

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

      // Invalidasi cache laporan yang diubah
      await Promise.all([
        cacheInvalidateKey(`laporan:mpk:detail:${request.params.id}`),
        cacheInvalidatePattern('laporan:mpk:list:*'),
      ]);

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

      // Invalidasi cache — laporan ini sekarang muncul di dashboard Pembina juga
      await Promise.all([
        cacheInvalidateKey(`laporan:mpk:detail:${request.params.id}`),
        cacheInvalidatePattern('laporan:mpk:list:*'),
        cacheInvalidatePattern('laporan:pembina:list:*'),
      ]);

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

      // Invalidasi cache detail agar balasan terbaru langsung terlihat
      await cacheInvalidateKey(`laporan:mpk:detail:${request.params.id}`);

      return reply.status(201).send({ message: 'Balasan berhasil dikirim.', balasan });
    },
  );
}
