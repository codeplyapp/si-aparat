/**
 * Module: MPK Dashboard
 * Semua route membutuhkan role MPK atau SUPER_ADMIN
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { StatusLaporan } from '@si-aparat/shared';
import { requireMPK, JwtPayload } from '../../middleware/auth';
import { decryptText } from '../../lib/crypto';
import { getPresignedDownloadUrl } from '../../lib/storage';

const prisma = new PrismaClient();

const updateStatusSchema = z.object({
  status: z.nativeEnum(StatusLaporan),
});

const balasanSchema = z.object({
  pesan: z.string().min(1).max(500),
});

export async function mpkRoutes(fastify: FastifyInstance) {
  // Terapkan auth untuk semua route di modul ini
  fastify.addHook('preHandler', requireMPK);

  // ─── GET /api/v1/mpk/laporan ──────────────────────────────────────
  fastify.get('/laporan', async (_request: FastifyRequest, reply: FastifyReply) => {
    const { status, kategori, page = '1', limit = '20' } = _request.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status && status !== 'undefined') where.status = status;
    if (kategori && kategori !== 'undefined') where.kategori = kategori;

    const skip = (Number(page) - 1) * Number(limit);

    const [laporan, total] = await Promise.all([
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
          createdAt: true,
          updatedAt: true,
          _count: { select: { lampiran: true } },
        },
      }),
      prisma.laporan.count({ where }),
    ]);

    return reply.send({
      data: laporan,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
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
