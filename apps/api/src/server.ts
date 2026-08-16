/**
 * Fastify Server Entry Point — SI-APARAT API
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';

import { aspirasiRoutes } from './modules/aspirasi/aspirasi.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { mpkRoutes } from './modules/mpk/mpk.routes';
import { pembinaRoutes } from './modules/pembina/pembina.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { internalRoutes } from './modules/internal/internal.routes';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    // ⚠️ Pastikan redact IP dari log
    redact: ['req.remoteAddress', 'req.ip', 'req.headers["x-forwarded-for"]'],
  },
});

async function bootstrap() {
  // ─── Security Plugins ─────────────────────────────────────────────
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);

      const allowedOrigins = [
        'https://si-aparat-web.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL,
      ].filter(Boolean) as string[];

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return cb(null, true);
      }

      // Default fallback for trusted domain matches
      return cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ─── Auth ─────────────────────────────────────────────────────────
  await server.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'CHANGE_ME_IN_PRODUCTION',
    sign: { expiresIn: '8h' },
  });

  // ─── Rate Limiting (global default) ───────────────────────────────
  // Route-specific rate limit untuk /aspirasi didefinisikan di route-nya sendiri
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Gunakan IP dummy karena kita anonymize — rate limit via IP header asli di Nginx/Render level
    keyGenerator: (req) => req.headers['x-real-ip'] as string ?? '0.0.0.0',
  });

  // ─── Multipart (file upload) ───────────────────────────────────────
  await server.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per file
      files: 3,                  // Max 3 file
    },
  });

  // ─── Health Check ─────────────────────────────────────────────────
  server.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'si-aparat-api',
  }));

  // ─── Routes ───────────────────────────────────────────────────────
  await server.register(aspirasiRoutes, { prefix: '/api/v1/aspirasi' });
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(mpkRoutes, { prefix: '/api/v1/mpk' });
  await server.register(pembinaRoutes, { prefix: '/api/v1/pembina' });
  await server.register(adminRoutes, { prefix: '/api/v1/admin' });
  await server.register(internalRoutes, { prefix: '/api/internal' });
  await server.register(internalRoutes, { prefix: '/api/v1/internal' });

  // ─── Global Error Handler ─────────────────────────────────────────
  server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Terlalu banyak permintaan. Coba lagi nanti.',
      });
    }

    return reply.status(error.statusCode ?? 500).send({
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Terjadi kesalahan pada server.'
          : error.message,
    });
  });

  // ─── Start Server ─────────────────────────────────────────────────
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await server.listen({ port, host });
  server.log.info(`🚀 SI-APARAT API running on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
