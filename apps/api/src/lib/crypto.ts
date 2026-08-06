/**
 * AES-256-GCM Encryption/Decryption
 * Digunakan untuk: konten laporan (string) dan file foto (Buffer)
 *
 * Key: 32 bytes (256 bit) dari env ENCRYPTION_KEY (hex string 64 karakter)
 * IV : 12 bytes random per enkripsi (disimpan bersama ciphertext)
 * Tag: 16 bytes GCM auth tag (disimpan bersama ciphertext)
 *
 * Format ciphertext string (base64):
 *   [iv:12bytes][tag:16bytes][ciphertext:Nbytes]
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // GCM recommended
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

// ─── Text ─────────────────────────────────────────────────────────────────

/**
 * Enkripsi string → base64 string
 * Format: base64(iv[12] + tag[16] + ciphertext)
 */
export function encryptText(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Dekripsi base64 string → plaintext string
 */
export function decryptText(ciphertext: string): string {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}

// ─── File / Buffer ─────────────────────────────────────────────────────────

/**
 * Enkripsi Buffer (file foto) → Buffer terenkripsi
 * Format: iv[12] + tag[16] + ciphertext[N]
 */
export function encryptBuffer(plainBuffer: Buffer): Buffer {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainBuffer),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Dekripsi Buffer terenkripsi → Buffer asli
 */
export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
  const key = getKey();

  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const tag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}
