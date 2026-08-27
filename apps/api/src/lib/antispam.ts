import crypto from 'crypto';

// In-memory cache untuk pencegahan double-click & rapid flooding duplikasi (10 detik TTL)
const recentSubmissions = new Map<string, number>();

// Pembersihan berkala setiap 5 menit untuk mencegah memory leak
setInterval(() => {
  const now = Date.now();
  for (const [hash, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60_000) {
      recentSubmissions.delete(hash);
    }
  }
}, 5 * 60_000).unref();

export interface AntiSpamOptions {
  honeypot?: string;
  formTimestamp?: string | number;
  konten: string;
}

export interface AntiSpamResult {
  isValid: boolean;
  message?: string;
}

/**
 * Membersihkan karakter tidak terlihat (zero-width characters & control chars)
 */
export function sanitizeKonten(konten: string): string {
  return konten
    .replace(/[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

/**
 * 1. Honeypot check: Field tersembunyi yang hanya diisi oleh bot crawler/spammer.
 */
export function checkHoneypot(honeypot?: string): AntiSpamResult {
  if (honeypot && honeypot.trim().length > 0) {
    return {
      isValid: false,
      message: 'Aktivitas pengisian bot terdeteksi (Honeypot trap).',
    };
  }
  return { isValid: true };
}

/**
 * 2. Speed / Time-trap check: Memastikan form diisi oleh manusia (butuh minimal 1.5 detik).
 */
export function checkSubmissionSpeed(
  formTimestamp?: string | number,
  minWaitMs = 1500,
  maxAgeMs = 24 * 60 * 60 * 1000,
): AntiSpamResult {
  if (!formTimestamp) {
    // Jika timestamp tidak dikirim (misal API direct), izinkan selama lolos filter lainnya
    return { isValid: true };
  }

  const ts = typeof formTimestamp === 'string' ? Number(formTimestamp) : formTimestamp;
  if (isNaN(ts) || ts <= 0) {
    return {
      isValid: false,
      message: 'Timestamp sesi pengiriman formulir tidak valid.',
    };
  }

  const now = Date.now();

  // Waktu dari masa depan lebih dari 1 menit (clock drift / manipulasi bot)
  if (ts - now > 60_000) {
    return {
      isValid: false,
      message: 'Waktu perangkat pengirim tidak sinkron.',
    };
  }

  // Pengiriman instan di bawah batas wajar waktu ketik manusia (bot sub-second)
  if (now - ts < minWaitMs) {
    return {
      isValid: false,
      message: 'Pengiriman formulir terlalu cepat. Mohon isi laporan dengan teliti.',
    };
  }

  // Formulir sudah terbuka lebih dari 24 jam (stale session)
  if (now - ts > maxAgeMs) {
    return {
      isValid: false,
      message: 'Sesi formulir telah kedaluwarsa. Silakan muat ulang halaman.',
    };
  }

  return { isValid: true };
}

/**
 * 3. Anti-Gibberish & Repetition Heuristics
 */
export function checkContentHeuristics(konten: string): AntiSpamResult {
  const cleaned = sanitizeKonten(konten);

  if (cleaned.length < 20) {
    return {
      isValid: false,
      message: 'Konten laporan minimal 20 karakter.',
    };
  }

  // Deteksi pengulangan 1 karakter yang berlebihan berturut-turut (mis. aaaaaaaaaa...)
  if (/(.)\1{9,}/i.test(cleaned)) {
    return {
      isValid: false,
      message: 'Konten terdeteksi mengandung pengulangan karakter yang tidak wajar.',
    };
  }

  // Deteksi keragaman karakter (minimum 5 karakter unik untuk teks 20+ karakter)
  const uniqueChars = new Set(cleaned.toLowerCase().replace(/\s+/g, ''));
  if (uniqueChars.size < 5) {
    return {
      isValid: false,
      message: 'Konten laporan tidak memenuhi batas keragaman teks yang valid.',
    };
  }

  // Deteksi pengulangan kata yang ekstrem (misal "tes tes tes tes tes tes")
  const words = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 6) {
    const uniqueWords = new Set(words);
    if (uniqueWords.size <= 2) {
      return {
        isValid: false,
        message: 'Konten laporan terdeteksi berpola spam pengulangan kata.',
      };
    }
  }

  return { isValid: true };
}

/**
 * 4. Duplicate Flooding Check: Menolak spam double-click / rapid replay payload identik dalam 10 detik.
 */
export function checkDuplicateFlooding(konten: string, windowMs = 10_000): AntiSpamResult {
  const normalized = sanitizeKonten(konten).toLowerCase().replace(/\s+/g, ' ');
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');

  const now = Date.now();
  const lastTime = recentSubmissions.get(hash);

  if (lastTime && now - lastTime < windowMs) {
    return {
      isValid: false,
      message: 'Laporan serupa baru saja dikirim. Mohon tunggu beberapa detik sebelum mengirim laporan yang sama.',
    };
  }

  recentSubmissions.set(hash, now);
  return { isValid: true };
}

/**
 * Validasi agregat seluruh lapisan proteksi anti-spam
 */
export function validateAntiSpam(options: AntiSpamOptions): AntiSpamResult {
  // Layer 1: Honeypot
  const hpResult = checkHoneypot(options.honeypot);
  if (!hpResult.isValid) return hpResult;

  // Layer 2: Speed / Time-Trap
  const speedResult = checkSubmissionSpeed(options.formTimestamp);
  if (!speedResult.isValid) return speedResult;

  // Layer 3: Konten Heuristics (Anti-gibberish / karakter berulang)
  const heuristicResult = checkContentHeuristics(options.konten);
  if (!heuristicResult.isValid) return heuristicResult;

  // Layer 4: Duplicate Flooding Trap (10 detik untuk konten yang sama persis)
  const duplicateResult = checkDuplicateFlooding(options.konten);
  if (!duplicateResult.isValid) return duplicateResult;

  return { isValid: true };
}

/**
 * Untuk keperluan testing: mereset cache duplikasi
 */
export function clearDuplicateCache(): void {
  recentSubmissions.clear();
}
