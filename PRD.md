# 📋 Product Requirements Document (PRD)
## SI-APARAT — Sistem Informasi & Aspirasi Taruna

> **Versi:** 1.0.0  
> **Tanggal:** 5 Agustus 2026  
> **Status:** Draft — Pending Review  
> **Pemilik Produk:** MPK (Majelis Perwakilan Kelas) / Pembina OSIS  

---

## 1. Ringkasan Eksekutif
SI-APARAT adalah platform aspirasi digital berbasis web yang dirancang khusus untuk lingkungan kesatriaan dan sekolah bersistem semi-militer. Platform ini menjadi jembatan aman antara **Taruna-Taruni** (pelapor) dengan **MPK** (moderator), dan **Pengasuh/Pembina** (pemangku kebijakan) dengan jaminan **anonimitas penuh** 100%.

### Masalah yang Diselesaikan
*   Taruna takut melaporkan perundungan (bullying) karena khawatir identitas bocor atau ada sanksi sosial.
*   Keluhan sarana-prasarana tidak sampai ke pihak berwenang sehingga fasilitas rusak terabaikan.
*   Tidak ada saluran resmi terstruktur untuk aspirasi kegiatan.
*   MPK sulit memantau, memfilter, dan mendokumentasikan laporan secara rahasia.

---

## 2. Tujuan & Sasaran Produk

### 2.1 Tujuan Utama
*   Memberikan **ruang aman 100%** bagi Taruna-Taruni untuk menyampaikan aspirasi dan laporan tanpa rasa takut.
*   Mempercepat respons MPK dan Pengasuh terhadap setiap laporan.
*   Menciptakan ekosistem digital transparan namun tetap melindungi privasi pelapor.

### 2.2 OKR (Objectives & Key Results)
*   **Objective 1:** Tingkatkan partisipasi aspirasi Taruna. (KR: >= 80% Taruna tahu SI-APARAT dalam 30 hari; >= 50 laporan per bulan pertama).
*   **Objective 2:** Percepat penanganan laporan. (KR: 100% laporan ada status update dalam 3x24 jam; 90% laporan "Perundungan" ditangani dalam 1x24 jam).
*   **Objective 3:** Jaga kepercayaan & anonimitas. (KR: Zero incident kebocoran identitas; Tidak ada identitas tersimpan di DB).

---

## 3. Persona Pengguna
1.  **Taruna Pelapor (Anonim):** Usia 15-18. Membutuhkan kepastian identitas aman. Melaporkan tanpa login.
2.  **MPK (Moderator):** Terpilih resmi, punya akun login. Menyaring laporan, meneruskan yang valid ke Pembina.
3.  **Pengasuh/Pembina (Viewer):** Punya akun read-only. Menindaklanjuti kasus di lapangan (eskalasi).

---

## 4. Ruang Lingkup (Scope) v1.0
*   **In Scope:** Form aspirasi anonim, Kategori Laporan (Sarana, Kegiatan, Perundungan, Lainnya), Kode Tracking, Dashboard MPK, Notifikasi alert merah untuk Perundungan, Dashboard Pembina.
*   **Out of Scope:** Aplikasi mobile native, Integrasi SIAKAD, SMS/WA Notif, SSO Sekolah.

---

## 5. Persyaratan Fungsional
1.  **Modul Pelaporan (F-01):** Akses tanpa akun, opsi unggah foto bukti max 3x5MB, generate Kode Tracking `APR-YYYYMMDD-XXXX`.
2.  **Modul Autentikasi (F-02):** Login MPK/Pembina via username resmi. Sesi kedaluwarsa 8 jam.
3.  **Modul MPK (F-03):** Filter laporan, update status (BARU->DIPROSES->DITERUSKAN->SELESAI), balasan anonim ke pelapor.
4.  **Modul Pembina (F-04):** Lihat daftar laporan eskalasi MPK, catat tindak lanjut. Identitas pelapor tidak akan tampil karena memang tidak disimpan.
5.  **Modul Tracking (F-05):** Publik cek status via Kode Tracking tanpa membuka data konten utuh (jika kode bocor).

---

## 6. Persyaratan Non-Fungsional
*   **Keamanan (Zero-logging):** Tidak menyimpan IP Address, User-Agent, dan mengenkripsi konten (AES-256).
*   **Performa:** Load <= 2 detik di 4G. API response <= 500ms.
*   **Rate Limiting:** Max 5 laporan per IP per 24 jam untuk cegah spam.
