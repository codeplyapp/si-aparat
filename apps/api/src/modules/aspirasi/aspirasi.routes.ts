/**
 * Module: Aspirasi
 * Routes publik — TIDAK memerlukan autentikasi
 *
 * POST /api/v1/aspirasi          — Submit laporan baru
 * GET  /api/v1/aspirasi/tracking/:kode — Cek status laporan
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  KategoriLaporan,
  KONTEN_MIN_LENGTH,
  KONTEN_MAX_LENGTH,
  StatusLaporan,
} from '@si-aparat/shared';
import { anonymizeMiddleware } from '../../middleware/anonymize';
import { encryptText, decryptText, encryptBuffer } from '../../lib/crypto';
import { generateKodeTracking, isValidKodeTracking } from '../../lib/tracking';
import { processImage, ImageValidationError } from '../../lib/image';
import { uploadEncryptedFile, generateStorageKey } from '../../lib/storage';
import { sendNewReportNotification } from '../../lib/email';

const prisma = new PrismaClient();

const submitSchema = z.object({
  kategori: z.nativeEnum(KategoriLaporan),
  konten: z
    .string()
    .min(KONTEN_MIN_LENGTH, `Konten minimal ${KONTEN_MIN_LENGTH} karakter`)
    .max(KONTEN_MAX_LENGTH, `Konten maksimal ${KONTEN_MAX_LENGTH} karakter`),
});

export async function aspirasiRoutes(fastify: FastifyInstance) {
  // ─── POST /api/v1/aspirasi ────────────────────────────────────────
  fastify.post(
    '/',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '24 hours',
          keyGenerator: (req: FastifyRequest) =>
            (req.headers['x-real-ip'] as string) ?? '0.0.0.0',
          errorResponseBuilder: () => ({
            error: 'Too Many Requests',
            message:
              'Anda telah mencapai batas maksimum 5 laporan per hari. Coba lagi besok.',
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Anonymize sebelum proses apapun
      await anonymizeMiddleware(request, reply);

      // Parse multipart form
      const parts = request.parts();
      let kategori: KategoriLaporan | undefined;
      let konten: string | undefined;
      const fotoBuffers: { buffer: Buffer; fieldname: string }[] = [];

      for await (const part of parts) {
        if (part.type === 'field') {
          if (part.fieldname === 'kategori') kategori = part.value as KategoriLaporan;
          if (part.fieldname === 'konten') konten = part.value as string;
        } else if (part.type === 'file' && part.fieldname === 'foto') {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fotoBuffers.push({ buffer: Buffer.concat(chunks), fieldname: part.fieldname });
        }
      }

      // Validasi input
      const parsed = submitSchema.safeParse({ kategori, konten });
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.errors[0]?.message ?? 'Input tidak valid',
        });
      }

      // Generate kode tracking unik (retry jika collision)
      let kodeTracking: string;
      let attempts = 0;
      do {
        kodeTracking = generateKodeTracking();
        const existing = await prisma.laporan.findUnique({ where: { kodeTracking } });
        if (!existing) break;
        attempts++;
      } while (attempts < 5);

      // Enkripsi konten
      const kontenEncrypted = encryptText(parsed.data.konten);

      // Simpan laporan ke DB
      const laporan = await prisma.laporan.create({
        data: {
          kodeTracking,
          kategori: parsed.data.kategori,
          konten: kontenEncrypted,
          status: StatusLaporan.BARU,
        },
      });

      // Proses & upload foto (jika ada)
      const fotoErrors: string[] = [];
      for (const { buffer } of fotoBuffers) {
        try {
          const processed = await processImage(buffer);
          const encryptedBuffer = encryptBuffer(processed.buffer);
          const r2Key = generateStorageKey(laporan.id);

          await uploadEncryptedFile(r2Key, encryptedBuffer);
          await prisma.lampiranFoto.create({
            data: {
              laporanId: laporan.id,
              r2Key,
              isEncrypted: true,
              mimeType: processed.mimeType,
              fileSizeBytes: processed.fileSizeBytes,
            },
          });
        } catch (err) {
          if (err instanceof ImageValidationError) {
            fotoErrors.push(err.message);
          } else {
            fastify.log.error(err as Error, 'Failed to process/upload foto');
            fotoErrors.push('Gagal mengunggah salah satu foto.');
          }
        }
      }

      // Kirim email notifikasi ke semua MPK & SUPER_ADMIN
      prisma.user
        .findMany({
          where: {
            role: { in: ['MPK', 'SUPER_ADMIN'] },
            email: { not: null },
          },
          select: { email: true },
        })
        .then(async (users) => {
          const emails = users
            .map((u) => u.email)
            .filter((e): e is string => Boolean(e));
          if (emails.length === 0) {
            fastify.log.warn('Email notification skipped: No recipient emails found in DB.');
            return;
          }
          fastify.log.info(`Sending email notification to ${emails.join(', ')}...`);
          await sendNewReportNotification(emails, parsed.data.kategori, kodeTracking);
          fastify.log.info('Email notification sent successfully via Resend.');
        })
        .catch((err) => fastify.log.error('Email notification failed:', err));

      return reply.status(201).send({
        kodeTracking,
        message:
          'Laporan berhasil dikirim. Simpan kode tracking Anda untuk memantau status.',
        fotoWarnings: fotoErrors.length > 0 ? fotoErrors : undefined,
      });
    },
  );

  // ─── GET /api/v1/aspirasi/tracking/:kode ─────────────────────────
  fastify.get(
    '/tracking/:kode',
    async (
      request: FastifyRequest<{ Params: { kode: string } }>,
      reply: FastifyReply,
    ) => {
      const { kode } = request.params;

      if (!isValidKodeTracking(kode)) {
        return reply.status(400).send({
          error: 'Invalid Format',
          message: 'Format kode tracking tidak valid.',
        });
      }

      const laporan = await prisma.laporan.findUnique({
        where: { kodeTracking: kode },
        include: {
          balasan: { select: { pesan: true, createdAt: true } },
        },
      });

      if (!laporan) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Kode tracking tidak ditemukan.',
        });
      }

      // ⚠️ TIDAK mengembalikan konten laporan ke publik (cukup status & balasan)
      return reply.send({
        kodeTracking: laporan.kodeTracking,
        kategori: laporan.kategori,
        status: laporan.status,
        createdAt: laporan.createdAt.toISOString(),
        updatedAt: laporan.updatedAt.toISOString(),
        balasan: laporan.balasan
          ? {
              pesan: laporan.balasan.pesan,
              timestamp: laporan.balasan.createdAt.toISOString(),
            }
          : null,
      });
    },
  );
}
