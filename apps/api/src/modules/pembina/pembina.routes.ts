import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { RoleUser } from '@si-aparat/shared';
import { requirePembina, JwtPayload } from '../../middleware/auth';
import { decryptText, decryptBuffer } from '../../lib/crypto';
import { downloadEncryptedFile } from '../../lib/storage';

const prisma = new PrismaClient();

const catatanSchema = z.object({
  catatan: z.string().min(1).max(1000),
});

export async function pembinaRoutes(fastify: FastifyInstance) {
  // ─── GET /api/v1/pembina/foto/:fotoId (Streaming Dekripsi Foto) ─────
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

      // Generate route streaming URLs untuk foto terdekripsi
      const lampiranWithUrls = laporan.lampiran.map((foto) => ({
        id: foto.id,
        mimeType: foto.mimeType,
        fileSizeBytes: foto.fileSizeBytes,
        downloadUrl: `/api/v1/pembina/foto/${foto.id}`,
      }));

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
