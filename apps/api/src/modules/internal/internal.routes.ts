/**
 * Module: Internal API Routes (for n8n & internal service automation)
 * 
 * Endpoints:
 * - GET  /api/internal/reports/pending
 * - POST /api/internal/reports/mark-notified
 * 
 * Authentication:
 * Header `x-internal-api-key` matching process.env.INTERNAL_API_KEY
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { decryptText } from '../../lib/crypto';

const prisma = new PrismaClient();

export async function internalRoutes(fastify: FastifyInstance) {
  // Middleware autentikasi khusus endpoint internal
  fastify.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const apiKey = req.headers['x-internal-api-key'];
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || apiKey !== expectedKey) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid internal API key' });
    }
  });

  // Handler: GET pending reports (notifiedAt IS NULL)
  const getPendingReports = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const reports = await prisma.laporan.findMany({
        where: {
          notifiedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 50,
      });

      const formattedReports = reports.map((report) => {
        let isiPlain = '';
        try {
          if (report.konten) {
            isiPlain = decryptText(report.konten);
          }
        } catch (err) {
          isiPlain = '[Gagal mendekripsi isi laporan]';
        }

        return {
          id: report.id,
          kode: report.kodeTracking,
          kodeTracking: report.kodeTracking,
          kategori: report.kategori,
          isi: isiPlain,
          status: report.status,
          isEskalasi: report.isEskalasi,
          createdAt: report.createdAt.toISOString(),
        };
      });

      return reply.send({ reports: formattedReports });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  };

  // Handler: POST mark reports as notified
  const markNotifiedReports = async (
    req: FastifyRequest<{ Body: { ids: (string | number)[] } }>,
    reply: FastifyReply
  ) => {
    try {
      const { ids } = req.body || {};

      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'Invalid payload: ids array is required' });
      }

      const stringIds = ids.map((id) => String(id));

      const result = await prisma.laporan.updateMany({
        where: {
          id: { in: stringIds },
        },
        data: {
          notifiedAt: new Date(),
        },
      });

      return reply.send({ updated: result.count });
    } catch (error: any) {
      req.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
    }
  };

  // Register endpoints under prefixed and direct paths for maximum compatibility
  fastify.get('/reports/pending', getPendingReports);
  fastify.post('/reports/mark-notified', markNotifiedReports);

  fastify.get('/api/internal/reports/pending', getPendingReports);
  fastify.post('/api/internal/reports/mark-notified', markNotifiedReports);
}
