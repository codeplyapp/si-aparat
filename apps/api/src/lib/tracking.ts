/**
 * Kode Tracking Generator
 * Format: APR-YYYYMMDD-XXXX
 * Contoh: APR-20260806-7X3K
 *
 * - YYYYMMDD: Tanggal submit (WIB)
 * - XXXX: 4 karakter random alphanumeric uppercase (36^4 = ~1.7 juta kombinasi/hari)
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Hindari I/O/0/1 (ambiguous)

export function generateKodeTracking(): string {
  const now = new Date();

  // Format tanggal dalam WIB (UTC+7)
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const year = wib.getUTCFullYear();
  const month = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const day = String(wib.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate 4 karakter random
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  return `APR-${dateStr}-${suffix}`;
}

/**
 * Validasi format kode tracking
 */
export function isValidKodeTracking(kode: string): boolean {
  return /^APR-\d{8}-[A-Z2-9]{4}$/.test(kode);
}
