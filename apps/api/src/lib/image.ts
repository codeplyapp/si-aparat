/**
 * Image Processing Utility
 *
 * Menggunakan Sharp untuk:
 * 1. Validasi magic bytes (pastikan file benar-benar gambar)
 * 2. Strip semua metadata EXIF/GPS/IPTC
 * 3. Re-encode sebagai JPEG/WebP (membuang metadata tersembunyi)
 *
 * Dipanggil SEBELUM enkripsi dan upload ke R2.
 */

import sharp from 'sharp';
import { ALLOWED_FOTO_MIME, MAX_FOTO_SIZE_MB } from '@si-aparat/shared';

const MAX_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024; // 5 MB

// Magic bytes untuk validasi format file
const MAGIC_BYTES: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Validasi magic bytes file
 */
function validateMagicBytes(buffer: Buffer): string {
  for (const [mime, magic] of Object.entries(MAGIC_BYTES)) {
    if (buffer.subarray(0, magic.length).equals(magic)) {
      // Extra check untuk WebP: byte 8-11 harus 'WEBP'
      if (mime === 'image/webp') {
        const webpMarker = buffer.subarray(8, 12).toString('ascii');
        if (webpMarker !== 'WEBP') continue;
      }
      return mime;
    }
  }
  throw new ImageValidationError(
    'Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.',
  );
}

export interface ProcessedImage {
  buffer: Buffer;       // Buffer gambar setelah strip EXIF
  mimeType: string;     // MIME type tervalidasi
  fileSizeBytes: number; // Ukuran asli sebelum enkripsi
}

/**
 * Proses gambar: validasi → strip EXIF → re-encode
 *
 * @param rawBuffer - Buffer mentah dari upload
 * @returns ProcessedImage siap dienkripsi
 */
export async function processImage(rawBuffer: Buffer): Promise<ProcessedImage> {
  // 1. Cek ukuran file
  if (rawBuffer.length > MAX_BYTES) {
    throw new ImageValidationError(
      `Ukuran file melebihi batas maksimum ${MAX_FOTO_SIZE_MB}MB.`,
    );
  }

  // 2. Validasi magic bytes
  const detectedMime = validateMagicBytes(rawBuffer);

  if (!ALLOWED_FOTO_MIME.includes(detectedMime)) {
    throw new ImageValidationError(
      `Format file tidak diizinkan: ${detectedMime}`,
    );
  }

  // 3. Strip EXIF + re-encode via Sharp
  // withMetadata(false) = hapus semua metadata
  // Re-encode sebagai JPEG untuk konsistensi dan kompresi lebih kecil
  const strippedBuffer = await sharp(rawBuffer)
    .rotate() // Auto-rotate berdasarkan EXIF orientation, lalu hapus EXIF
    .jpeg({ quality: 85, progressive: true }) // Re-encode, hapus semua metadata
    .withMetadata({}) // Kosongkan metadata (double insurance)
    .toBuffer();

  return {
    buffer: strippedBuffer,
    mimeType: 'image/jpeg', // Selalu JPEG setelah re-encode
    fileSizeBytes: rawBuffer.length, // Ukuran original sebelum enkripsi
  };
}
