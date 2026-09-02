/**
 * Module: Pembina Dashboard
 * Hanya melihat laporan yang sudah di-eskalasi MPK (isEskalasi = true)
 * Role: PEMBINA atau SUPER_ADMIN
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requirePembina, JwtPayload } from '../../middleware/auth';
import { decryptText } from '../../lib/crypto';
import { getPresignedDownloadUrl } from '../../lib/storage';

const prisma = new PrismaClient();

const catatanSchema = z.object({
  catatan: z.string().min(1).max(1000),
});

export async function pembinaRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requirePembina);

  // ─── GET /api/v1/pembina/laporan ──────────────────────────────────
  fastify.get('/laporan', async (_request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '100' } = _request.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    const [laporan, total] = await Promise.all([
      prisma.laporan.findMany({
        where: { isEskalasi: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          kodeTracking: true,
          kategori: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { lampiran: true } },
        },
      }),
      prisma.laporan.count({ where: { isEskalasi: true } }),
    ]);

    return reply.send({
      data: laporan,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  });

  // ─── GET /api/v1/pembina/laporan/:id ─────────────────────────────
  fastify.get(
    '/laporan/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const laporan = await prisma.laporan.findFirst({
        where: { id: request.params.id, isEskalasi: true },
        include: {
          catatan: {
            include: { author: { select: { namaLengkap: true, role: true } } },
            orderBy: { createdAt: 'desc' },
          },
          balasan: true,
          lampiran: true,
          _count: { select: { lampiran: true } },
        },
      });

      if (!laporan) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Laporan tidak ditemukan atau belum dieskalasi.',
        });
      }

      // Dekripsi konten
      let kontenDecrypted: string;
      try {
        kontenDecrypted = decryptText(laporan.konten);
      } catch {
        kontenDecrypted = '[Gagal mendekripsi konten laporan]';
      }

      // Generate presigned URLs untuk foto bukti (15 menit TTL)
      const lampiranWithUrls = await Promise.all(
        laporan.lampiran.map(async (foto) => ({
          id: foto.id,
          mimeType: foto.mimeType,
          fileSizeBytes: foto.fileSizeBytes,
          downloadUrl: await getPresignedDownloadUrl(foto.r2Key),
        })),
      );

      return reply.send({
        id: laporan.id,
        kodeTracking: laporan.kodeTracking,
        kategori: laporan.kategori,
        status: laporan.status,
        konten: kontenDecrypted,
        jumlahFoto: laporan._count.lampiran,
        lampiran: lampiranWithUrls,
        catatan: laporan.catatan,
        balasan: laporan.balasan,
        createdAt: laporan.createdAt.toISOString(),
        updatedAt: laporan.updatedAt.toISOString(),
      });
    },
  );

  // ─── POST /api/v1/pembina/laporan/:id/catatan ─────────────────────
  fastify.post(
    '/laporan/:id/catatan',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const payload = request.user as JwtPayload;

      const parsed = catatanSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', message: 'Catatan tidak boleh kosong.' });
      }

      const laporan = await prisma.laporan.findFirst({
        where: { id: request.params.id, isEskalasi: true },
      });
      if (!laporan) {
        return reply.status(404).send({ error: 'Not Found', message: 'Laporan tidak ditemukan atau belum dieskalasi.' });
      }

      const catatan = await prisma.catatanPembina.create({
        data: {
          laporanId: request.params.id,
          authorId: payload.sub,
          catatan: parsed.data.catatan,
        },
      });

      return reply.status(201).send({ message: 'Catatan tindak lanjut berhasil disimpan.', catatan });
    },
  );
}
