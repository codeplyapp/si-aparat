# ✅ QA Checklist
## SI-APARAT — Sistem Informasi & Aspirasi Taruna

> **Versi:** 1.0.0  
> **Tanggal:** 5 Agustus 2026

---

## 1. Unit & Integration Tests (Wajib 100% Pass)
*   [ ] `isValidKonten` menolak string < 20 dan > 2000 karakter.
*   [ ] `generateKodeTracking` menghasilkan kode format unik `APR-YYYYMMDD-XXXX`.
*   [ ] Fungsi Enkripsi: `decryptKonten(encryptKonten(text)) === text`.
*   [ ] Endpoint `POST /api/v1/aspirasi` berhasil memberikan status 201 dengan data valid.
*   [ ] Rate Limiting: Endpoint menolak request ke-6 dari IP yang sama dalam 24 jam (Response 429).
*   [ ] Validasi Foto: Gagal unggah file `> 5MB` atau format terlarang (`.exe`, `.sh`).

## 2. Security Tests (Zero Tolerance)
*   [ ] **Zero IP Log:** Cek log server, pastikan IP Address klien TIDAK tersimpan (harus bernilai `0.0.0.0` atau *null*).
*   [ ] **DB Check:** Periksa tabel `Laporan` via SQL client, pastikan kolom `konten` berbentuk ciphertext (bukan bahasa manusia).
*   [ ] **Sanitization:** Input tag HTML `<script>alert(1)</script>` pada form tidak tereksekusi ketika MPK membaca laporan (Anti-XSS).
*   [ ] **Access Control:** Token MPK tidak bisa mengakses endpoint khusus Pembina (Response 403).

## 3. Performa & Mobile Tests
*   [ ] Lighthouse Performance Score `>= 85`.
*   [ ] Waktu load form utama `<= 2 detik` di koneksi 3G lambat.
*   [ ] Tampilan form tidak rusak/pecah saat dibuka dari Chrome Mobile dan Safari iOS (layar 320px).

## 4. UAT (User Acceptance Testing) - Taruna & Pengurus
*   [ ] Taruna UAT: Berhasil scan QR dan kirim aspirasi dalam waktu `<= 3 menit`.
*   [ ] MPK UAT: Berhasil mengubah status laporan menjadi DIPROSES.
*   [ ] Pembina UAT: Menegaskan bahwa mereka TIDAK dapat menemukan identitas pelapor dari dashboard.

## 5. Matriks Tabulasi & Penilaian Pleno MPK
*   [ ] **Unit Test Matriks:** Semua skenario presedensi `hitungStatusMatriks` lolos 100% (Melanggar aturan -> ARSIP, Perundungan -> PRIORITAS_UTAMA, Kegiatan -> DELEGASI_OSIS, Matriks Skor 1-4).
*   [ ] **Presedensi Aturan:** Laporan yang ditandai melanggar aturan sekolah langsung menjadi ARSIP meski skor dampak/kelayakan tinggi.
*   [ ] **Live Status Preview:** Perubahan skor dampak/kelayakan pada modal pleno langsung memperbarui preview badge status secara real-time.
*   [ ] **Penyimpanan Matriks:** Nilai `skorDampak`, `skorKelayakan`, `isMelanggarAturan`, `statusMatriks`, dan `catatanTindakLanjut` tersimpan presisten di database.
*   [ ] **Filter Matriks:** Filter Status Matriks pada Dashboard MPK menyaring data laporan dengan tepat (termasuk filter "Belum Dinilai").
*   [ ] **Export CSV Pleno:** File CSV hasil ekspor memiliki UTF-8 BOM dan delimiter titik koma (`;`) sehingga langsung terformat rapi di Microsoft Excel.

