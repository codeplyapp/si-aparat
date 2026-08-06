/**
 * JWT Verify Hook — digunakan oleh semua protected routes
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { RoleUser } from '@si-aparat/shared';

export interface JwtPayload {
  sub: string;
  username: string;
  role: RoleUser;
  namaLengkap: string;
}

/** Pastikan request memiliki JWT valid */
export async function verifyJwt(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  try {
    await request.jwtVerify();
    return true;
  } catch {
    reply.status(401).send({ error: 'Unauthorized', message: 'Token tidak valid atau sudah kedaluwarsa.' });
    return false;
  }
}

/** Pastikan role adalah MPK atau SUPER_ADMIN */
export async function requireMPK(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const isValid = await verifyJwt(request, reply);
  if (!isValid) return;
  const payload = request.user as JwtPayload;
  if (payload.role !== RoleUser.MPK && payload.role !== RoleUser.SUPER_ADMIN) {
    reply.status(403).send({ error: 'Forbidden', message: 'Akses ditolak. Hanya MPK yang diizinkan.' });
  }
}

/** Pastikan role adalah PEMBINA atau SUPER_ADMIN */
export async function requirePembina(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const isValid = await verifyJwt(request, reply);
  if (!isValid) return;
  const payload = request.user as JwtPayload;
  if (payload.role !== RoleUser.PEMBINA && payload.role !== RoleUser.SUPER_ADMIN) {
    reply.status(403).send({ error: 'Forbidden', message: 'Akses ditolak. Hanya Pembina yang diizinkan.' });
  }
}

/** Pastikan role adalah SUPER_ADMIN */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const isValid = await verifyJwt(request, reply);
  if (!isValid) return;
  const payload = request.user as JwtPayload;
  if (payload.role !== RoleUser.SUPER_ADMIN) {
    reply.status(403).send({ error: 'Forbidden', message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }
}
