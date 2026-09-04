/**
 * Redis Cache Helper — SI-APARAT API
 * Menggunakan Upstash Redis REST API (@upstash/redis)
 *
 * Graceful degradation:
 * - Jika UPSTASH_REDIS_REST_URL / TOKEN tidak dikonfigurasi, semua cache
 *   menjadi no-op dan request langsung ke DB seperti biasa.
 * - Semua error Redis ditangani secara silent agar tidak crash server.
 */

import { Redis } from '@upstash/redis';

// ─── Singleton Upstash Client ─────────────────────────────────────────────────

let _redis: Redis | null = null;
let _initialized = false;

function getClient(): Redis | null {
  if (_initialized) return _redis;
  _initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Cache dinonaktifkan — graceful degradation (aman untuk local dev)
    return null;
  }

  try {
    _redis = new Redis({ url, token });
    return _redis;
  } catch (err: any) {
    console.warn('[Redis] Failed to initialize (cache disabled):', err.message);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ambil data dari cache. Return `null` jika cache miss, Redis tidak tersedia, atau error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getClient();
  if (!client) return null;

  try {
    // @upstash/redis otomatis parse JSON
    return await client.get<T>(key);
  } catch {
    return null;
  }
}

/**
 * Simpan data ke cache dengan TTL (dalam detik).
 * No-op jika Redis tidak tersedia.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    // Silent fail
  }
}

/**
 * Hapus satu key spesifik dari cache.
 */
export async function cacheInvalidateKey(key: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch {
    // Silent fail
  }
}

/**
 * Hapus semua key yang cocok dengan pattern (misal `laporan:mpk:list:*`).
 * Menggunakan SCAN untuk menghindari blocking Redis pada dataset besar.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    let cursor = 0 as number | string;
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await client.scan(cursor as number, { match: pattern, count: 100 });
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (Number(cursor) !== 0);

    if (keysToDelete.length > 0) {
      await client.del(...keysToDelete);
    }
  } catch {
    // Silent fail
  }
}
