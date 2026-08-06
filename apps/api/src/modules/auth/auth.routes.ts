/**
 * Module: Auth
 * POST /api/v1/auth/login — Login MPK / Pembina / Admin
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/login
  fastify.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
          errorResponseBuilder: () => ({
            error: 'Too Many Requests',
            message: 'Terlalu banyak percobaan login. Silakan tunggu 1 menit.',
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Username dan password wajib diisi.',
        });
      }

      const { username, password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          passwordHash: true,
          role: true,
          namaLengkap: true,
          email: true,
        },
      });

      if (!user) {
        // Timing-safe: tetap bcrypt compare meskipun user tidak ada
        await bcrypt.compare(password, '$2b$12$invalidhashfortimingequalityxxx');
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Username atau password salah.',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Username atau password salah.',
        });
      }

      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 jam

      const token = fastify.jwt.sign({
        sub: user.id,
        username: user.username,
        role: user.role,
        namaLengkap: user.namaLengkap,
      });

      return reply.send({
        token,
        role: user.role,
        namaLengkap: user.namaLengkap,
        expiresAt: expiresAt.toISOString(),
      });
    },
  );
}
