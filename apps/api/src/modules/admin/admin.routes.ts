/**
 * Module: Admin Panel
 * CRUD akun User (MPK & Pembina)
 * Role: SUPER_ADMIN only
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { RoleUser } from '@si-aparat/shared';
import { requireAdmin } from '../../middleware/auth';

const prisma = new PrismaClient();

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100)
    .regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'Password harus mengandung huruf kapital dan angka'),
  namaLengkap: z.string().min(2).max(100),
  email: z.string().email('Format email tidak valid'),
  role: z.enum([RoleUser.MPK, RoleUser.PEMBINA]),
});

const updateUserSchema = z.object({
  namaLengkap: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  // ─── GET /api/v1/admin/users ──────────────────────────────────────
  fastify.get('/users', async (_request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return reply.send({ data: users });
  });

  // ─── POST /api/v1/admin/users ─────────────────────────────────────
  fastify.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: parsed.error.errors[0]?.message ?? 'Input tidak valid',
      });
    }

    // Cek duplikat username / email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: parsed.data.username },
          { email: parsed.data.email },
        ],
      },
    });

    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Username atau email sudah digunakan.',
      });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        passwordHash,
        namaLengkap: parsed.data.namaLengkap,
        email: parsed.data.email,
        role: parsed.data.role,
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return reply.status(201).send({ message: 'Akun berhasil dibuat.', user });
  });

  // ─── PATCH /api/v1/admin/users/:id ───────────────────────────────
  fastify.patch(
    '/users/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const parsed = updateUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation Error', message: 'Input tidak valid.' });
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.namaLengkap) updateData.namaLengkap = parsed.data.namaLengkap;
      if (parsed.data.email) updateData.email = parsed.data.email;
      if (parsed.data.password) {
        updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
      }

      const user = await prisma.user.update({
        where: { id: request.params.id },
        data: updateData,
        select: { id: true, username: true, namaLengkap: true, email: true, role: true },
      });

      return reply.send({ message: 'Akun berhasil diperbarui.', user });
    },
  );

  // ─── DELETE /api/v1/admin/users/:id ──────────────────────────────
  fastify.delete(
    '/users/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      // Cegah hapus akun SUPER_ADMIN
      const user = await prisma.user.findUnique({ where: { id: request.params.id } });
      if (!user) {
        return reply.status(404).send({ error: 'Not Found', message: 'Akun tidak ditemukan.' });
      }
      if (user.role === RoleUser.SUPER_ADMIN) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Akun SUPER_ADMIN tidak dapat dihapus.',
        });
      }

      await prisma.user.delete({ where: { id: request.params.id } });
      return reply.send({ message: 'Akun berhasil dihapus.' });
    },
  );
}
