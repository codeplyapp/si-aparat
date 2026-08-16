import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { internalRoutes } from '../src/modules/internal/internal.routes';

describe('Internal Routes API', () => {
  let app: FastifyInstance;
  const INTERNAL_KEY = 'test_internal_secret_key_12345';

  beforeAll(async () => {
    process.env.INTERNAL_API_KEY = INTERNAL_KEY;
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);

    app = Fastify();
    await app.register(internalRoutes, { prefix: '/api/internal' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without x-internal-api-key header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/internal/reports/pending',
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('Unauthorized');
  });

  it('rejects requests with invalid x-internal-api-key header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/internal/reports/pending',
      headers: {
        'x-internal-api-key': 'wrong_key',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts requests with valid x-internal-api-key header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/internal/reports/pending',
      headers: {
        'x-internal-api-key': INTERNAL_KEY,
      },
    });
    expect([200, 500]).toContain(res.statusCode);
  });

  it('validates payload on mark-notified endpoint', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/internal/reports/mark-notified',
      headers: {
        'x-internal-api-key': INTERNAL_KEY,
      },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
