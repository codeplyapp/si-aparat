import { describe, it, expect } from 'vitest';
import {
  KategoriLaporan,
  StatusMatriks,
  hitungStatusMatriks,
  STATUS_MATRIKS_LABELS,
  SKOR_DAMPAK_LABELS,
  SKOR_KELAYAKAN_LABELS,
} from '@si-aparat/shared';

describe('Matriks Tabulasi & Penilaian Aspirasi — hitungStatusMatriks', () => {
  describe('Presedensi Aturan 1: Melanggar Aturan -> ARSIP', () => {
    it('mengembalikan ARSIP jika isMelanggarAturan true pada kategori apapun', () => {
      // Bahkan jika kategori PERUNDUNGAN (Aturan 2)
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.PERUNDUNGAN,
          isMelanggarAturan: true,
          skorDampak: 4,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.ARSIP);

      // Bahkan jika kategori KEGIATAN (Aturan 3)
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.KEGIATAN,
          isMelanggarAturan: true,
        }),
      ).toBe(StatusMatriks.ARSIP);

      // Pada kategori SARANA dengan skor tinggi
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          isMelanggarAturan: true,
          skorDampak: 4,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.ARSIP);
    });
  });

  describe('Presedensi Aturan 2: Kategori PERUNDUNGAN -> PRIORITAS_UTAMA', () => {
    it('mengembalikan PRIORITAS_UTAMA untuk PERUNDUNGAN tanpa melihat skor', () => {
      // Tanpa skor
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.PERUNDUNGAN,
          isMelanggarAturan: false,
          skorDampak: null,
          skorKelayakan: null,
        }),
      ).toBe(StatusMatriks.PRIORITAS_UTAMA);

      // Dengan skor rendah sekalipun
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.PERUNDUNGAN,
          isMelanggarAturan: false,
          skorDampak: 1,
          skorKelayakan: 1,
        }),
      ).toBe(StatusMatriks.PRIORITAS_UTAMA);
    });
  });

  describe('Presedensi Aturan 3: Kategori KEGIATAN -> DELEGASI_OSIS', () => {
    it('mengembalikan DELEGASI_OSIS untuk KEGIATAN tanpa melihat skor', () => {
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.KEGIATAN,
          isMelanggarAturan: false,
        }),
      ).toBe(StatusMatriks.DELEGASI_OSIS);

      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.KEGIATAN,
          isMelanggarAturan: false,
          skorDampak: 4,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.DELEGASI_OSIS);
    });
  });

  describe('Presedensi Aturan 4: Skor Lengkap (1–4)', () => {
    it('Dampak >= 3 dan Kelayakan >= 3 -> PRIORITAS_UTAMA (termasuk overlap D=3, K=3)', () => {
      // Kasus overlap D=3, K=3 (Hijau menang di titik tumpang-tindih Kelayakan=3)
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 3,
          skorKelayakan: 3,
        }),
      ).toBe(StatusMatriks.PRIORITAS_UTAMA);

      // D=4, K=4
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.LAINNYA,
          skorDampak: 4,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.PRIORITAS_UTAMA);

      // D=4, K=3
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 4,
          skorKelayakan: 3,
        }),
      ).toBe(StatusMatriks.PRIORITAS_UTAMA);

      // D=3, K=4
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 3,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.PRIORITAS_UTAMA);
    });

    it('Dampak >= 3 dan Kelayakan <= 2 -> ADVOKASI', () => {
      // D=4, K=1
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 4,
          skorKelayakan: 1,
        }),
      ).toBe(StatusMatriks.ADVOKASI);

      // D=4, K=2
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 4,
          skorKelayakan: 2,
        }),
      ).toBe(StatusMatriks.ADVOKASI);

      // D=3, K=1
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.LAINNYA,
          skorDampak: 3,
          skorKelayakan: 1,
        }),
      ).toBe(StatusMatriks.ADVOKASI);

      // D=3, K=2
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 3,
          skorKelayakan: 2,
        }),
      ).toBe(StatusMatriks.ADVOKASI);
    });

    it('Dampak <= 2 -> ARSIP (terlepas dari skor kelayakan)', () => {
      // D=2, K=4
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 2,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.ARSIP);

      // D=2, K=1
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 2,
          skorKelayakan: 1,
        }),
      ).toBe(StatusMatriks.ARSIP);

      // D=1, K=4
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.LAINNYA,
          skorDampak: 1,
          skorKelayakan: 4,
        }),
      ).toBe(StatusMatriks.ARSIP);

      // D=1, K=1
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 1,
          skorKelayakan: 1,
        }),
      ).toBe(StatusMatriks.ARSIP);
    });
  });

  describe('Presedensi Aturan 5: Belum Dinilai / Skor Tidak Lengkap', () => {
    it('mengembalikan null jika skor belum lengkap pada kategori yang memerlukan penilaian', () => {
      // Tanpa parameter skor sama sekali
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
        }),
      ).toBeNull();

      // Hanya skor dampak yang diisi
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 4,
          skorKelayakan: null,
        }),
      ).toBeNull();

      // Hanya skor kelayakan yang diisi
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: null,
          skorKelayakan: 3,
        }),
      ).toBeNull();

      // Skor di luar rentang valid 1–4
      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 5,
          skorKelayakan: 3,
        }),
      ).toBeNull();

      expect(
        hitungStatusMatriks({
          kategori: KategoriLaporan.SARANA,
          skorDampak: 0,
          skorKelayakan: 3,
        }),
      ).toBeNull();
    });
  });

  describe('Konstanta dan Label Matriks', () => {
    it('memiliki label yang valid untuk semua StatusMatriks', () => {
      expect(STATUS_MATRIKS_LABELS[StatusMatriks.PRIORITAS_UTAMA]).toContain('Prioritas Utama');
      expect(STATUS_MATRIKS_LABELS[StatusMatriks.ADVOKASI]).toContain('Advokasi');
      expect(STATUS_MATRIKS_LABELS[StatusMatriks.DELEGASI_OSIS]).toContain('Delegasi OSIS');
      expect(STATUS_MATRIKS_LABELS[StatusMatriks.ARSIP]).toContain('Arsip');
    });

    it('memiliki deskripsi skor 1–4 untuk dampak dan kelayakan', () => {
      for (const i of [1, 2, 3, 4]) {
        expect(SKOR_DAMPAK_LABELS[i]).toBeDefined();
        expect(SKOR_KELAYAKAN_LABELS[i]).toBeDefined();
      }
    });
  });
});
