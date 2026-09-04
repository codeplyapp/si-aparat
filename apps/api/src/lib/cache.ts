/**
 * Redis Cache Helper — SI-APARAT API
 *
 * Menyediakan fungsi cache get/set/invalidate dengan graceful degradation:
 * - Jika REDIS_URL tidak dikonfigurasi, semua operasi menjadi no-op (request langsung ke DB)
 * - Semua error Redis ditangani secara silent agar tidak crash server
 */

import Redis from 'ioredis';

// ─── Singleton Redis Client ───────────────────────────────────────────────────

let _redis: Redis | null = null;
let _initialized = false;

function getClient(): Redis | null {
  if (_initialized) return _redis;
  _initialized = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    // Cache dinonaktifkan — graceful degradation
    return null;
  }

  try {
    _redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    _redis.on('error', (err) => {
      // Hanya log, jangan crash — aplikasi tetap berjalan tanpa cache
      console.warn('[Redis] Connection error (cache disabled):', err.message);
    });

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
    const val = await client.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
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
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
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
 * Gunakan dengan hemat — KEYS command blokir Redis sebentar.
 * Aman untuk dataset kecil seperti ini.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // Silent fail
  }
}
