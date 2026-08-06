/**
 * Anonymize Middleware
 *
 * Diaplikasikan pada SEMUA route publik (form aspirasi).
 * Memastikan tidak ada identitas pelapor yang tersimpan di log atau DB.
 *
 * Tindakan:
 * 1. Override req.ip menjadi '0.0.0.0'
 * 2. Hapus header User-Agent, X-Forwarded-For, X-Real-IP
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export async function anonymizeMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Override IP ke nilai null/zero
  Object.defineProperty(request, 'ip', {
    value: '0.0.0.0',
    writable: false,
    configurable: true,
  });

  // Hapus header yang bisa mengidentifikasi pelapor
  delete request.headers['user-agent'];
  delete request.headers['x-forwarded-for'];
  delete request.headers['x-real-ip'];
  delete request.headers['x-forwarded-host'];
  delete request.headers['cf-connecting-ip']; // Cloudflare
  delete request.headers['true-client-ip'];   // Akamai/Cloudflare
}
