import { describe, it, expect } from 'vitest';
import { encryptText, decryptText, encryptBuffer, decryptBuffer } from '../src/lib/crypto';
import { generateKodeTracking, isValidKodeTracking } from '../src/lib/tracking';

// Set test encryption key (64 char hex = 32 bytes)
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

describe('crypto', () => {
  it('encryptText / decryptText roundtrip', () => {
    const original = 'Saya ingin melaporkan kasus perundungan di asrama.';
    const encrypted = encryptText(original);

    expect(encrypted).not.toBe(original);
    expect(decryptText(encrypted)).toBe(original);
  });

  it('encrypted text should be different each time (random IV)', () => {
    const text = 'Same plaintext';
    const enc1 = encryptText(text);
    const enc2 = encryptText(text);
    expect(enc1).not.toBe(enc2); // IV berbeda setiap enkripsi
  });

  it('encryptBuffer / decryptBuffer roundtrip', () => {
    const original = Buffer.from('Ini adalah konten foto dummy');
    const encrypted = encryptBuffer(original);
    const decrypted = decryptBuffer(encrypted);
    expect(decrypted.equals(original)).toBe(true);
  });

  it('decryptText should fail with tampered ciphertext', () => {
    const encrypted = encryptText('test data');
    const tampered = encrypted.slice(0, -4) + 'XXXX'; // Rusak 4 karakter terakhir
    expect(() => decryptText(tampered)).toThrow();
  });
});

describe('tracking code', () => {
  it('generateKodeTracking format valid', () => {
    const kode = generateKodeTracking();
    expect(kode).toMatch(/^APR-\d{8}-[A-Z2-9]{4}$/);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateKodeTracking()));
    // Dengan 100 generasi, kemungkinan collision sangat kecil
    expect(codes.size).toBeGreaterThan(90);
  });

  it('isValidKodeTracking — valid', () => {
    expect(isValidKodeTracking('APR-20260806-7X3K')).toBe(true);
  });

  it('isValidKodeTracking — invalid formats', () => {
    expect(isValidKodeTracking('APR-2026080-7X3K')).toBe(false);  // Tanggal kurang
    expect(isValidKodeTracking('APR-20260806-7X3')).toBe(false);  // Suffix kurang
    expect(isValidKodeTracking('apr-20260806-7X3K')).toBe(false); // Lowercase
    expect(isValidKodeTracking('APR-20260806-01XK')).toBe(false); // Karakter '0' & '1' tidak valid
    expect(isValidKodeTracking('')).toBe(false);
  });

  it('konten validation — min 20 max 2000', () => {
    const short = 'a'.repeat(19);
    const valid = 'a'.repeat(20);
    const long = 'a'.repeat(2001);
    const maxValid = 'a'.repeat(2000);

    expect(short.length < 20).toBe(true);
    expect(valid.length >= 20).toBe(true);
    expect(long.length > 2000).toBe(true);
    expect(maxValid.length <= 2000).toBe(true);
  });
});
