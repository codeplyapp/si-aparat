import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkHoneypot,
  checkSubmissionSpeed,
  checkContentHeuristics,
  checkDuplicateFlooding,
  validateAntiSpam,
  sanitizeKonten,
  clearDuplicateCache,
} from '../src/lib/antispam';

describe('Anti-Spam Multi-Layer Protection Unit Tests', () => {
  beforeEach(() => {
    clearDuplicateCache();
  });

  describe('Layer 1: Honeypot Protection', () => {
    it('passes when honeypot is undefined or empty', () => {
      expect(checkHoneypot(undefined).isValid).toBe(true);
      expect(checkHoneypot('').isValid).toBe(true);
      expect(checkHoneypot('   ').isValid).toBe(true);
    });

    it('rejects when honeypot is filled by bot crawler', () => {
      const result = checkHoneypot('http://spam-link.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Honeypot trap');
    });
  });

  describe('Layer 2: Speed / Time-Trap Protection', () => {
    it('passes when form was rendered >1.5s ago', () => {
      const now = Date.now();
      const validFormTime = now - 3000; // 3 detik lalu
      const result = checkSubmissionSpeed(validFormTime);
      expect(result.isValid).toBe(true);
    });

    it('rejects instant bot submission (<1.5s)', () => {
      const now = Date.now();
      const instantTime = now - 200; // hanya 200ms lalu
      const result = checkSubmissionSpeed(instantTime);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Pengiriman formulir terlalu cepat');
    });

    it('rejects future timestamp (bot timestamp manipulation)', () => {
      const now = Date.now();
      const futureTime = now + 120_000; // 2 menit di masa depan
      const result = checkSubmissionSpeed(futureTime);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('tidak sinkron');
    });

    it('rejects stale sessions (>24 hours)', () => {
      const now = Date.now();
      const staleTime = now - 25 * 60 * 60 * 1000;
      const result = checkSubmissionSpeed(staleTime);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('kedaluwarsa');
    });
  });

  describe('Layer 3: Content Heuristics & Anti-Gibberish', () => {
    it('passes normal informative human report text', () => {
      const normalText = 'Kran air di kamar mandi asrama barat lantai 2 rusak dan bocor sejak kemarin.';
      const result = checkContentHeuristics(normalText);
      expect(result.isValid).toBe(true);
    });

    it('rejects repetitive single characters (e.g. aaaaaaaaaaaa...) > 10 chars', () => {
      const repetitiveText = 'aaaaaaaaaaaaaaaaaaaaa tolong diperbaiki ya';
      const result = checkContentHeuristics(repetitiveText);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('pengulangan karakter');
    });

    it('rejects low character diversity spam (e.g. 11111111111111111111)', () => {
      const lowDiversity = '11221122112211221122'; // hanya 2 karakter unik
      const result = checkContentHeuristics(lowDiversity);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('keragaman teks');
    });

    it('rejects repetitive word spam patterns', () => {
      const spamWords = 'lapor lapor lapor lapor lapor lapor lapor';
      const result = checkContentHeuristics(spamWords);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('berpola spam');
    });

    it('sanitizes zero-width and invisible control characters', () => {
      const dirty = '\u200B\uFEFFKran air asrama rusak\u0000 segera diperbaiki.';
      const cleaned = sanitizeKonten(dirty);
      expect(cleaned).toBe('Kran air asrama rusak segera diperbaiki.');
      expect(cleaned.includes('\u200B')).toBe(false);
    });
  });

  describe('Layer 4: Duplicate Flooding Trap (10s window)', () => {
    const reportText = 'Lampu koridor gedung C padam sejak tadi malam, mohon segera diganti.';

    it('allows first submission of report', () => {
      const first = checkDuplicateFlooding(reportText);
      expect(first.isValid).toBe(true);
    });

    it('blocks immediate second submission of the identical report within 10s', () => {
      checkDuplicateFlooding(reportText);
      const second = checkDuplicateFlooding(reportText);
      expect(second.isValid).toBe(false);
      expect(second.message).toContain('Laporan serupa baru saja dikirim');
    });

    it('allows a different report to be submitted immediately without limit', () => {
      const report1 = 'Lampu koridor gedung C padam sejak tadi malam.';
      const report2 = 'Keran wastafel gedung B bocor dan air terus mengalir.';

      expect(checkDuplicateFlooding(report1).isValid).toBe(true);
      expect(checkDuplicateFlooding(report2).isValid).toBe(true); // Langsung bisa kirim laporan berbeda!
    });
  });

  describe('Full validateAntiSpam integration', () => {
    it('passes clean report with valid timestamp and empty honeypot', () => {
      const result = validateAntiSpam({
        honeypot: '',
        formTimestamp: Date.now() - 5000,
        konten: 'Saya ingin melaporkan fasilitas AC di ruang kelas 12 rusak dan tidak dingin.',
      });
      expect(result.isValid).toBe(true);
    });

    it('fails immediately when honeypot is triggered', () => {
      const result = validateAntiSpam({
        honeypot: 'bot-fill',
        formTimestamp: Date.now() - 5000,
        konten: 'Saya ingin melaporkan fasilitas AC di ruang kelas 12 rusak dan tidak dingin.',
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Honeypot trap');
    });
  });
});
