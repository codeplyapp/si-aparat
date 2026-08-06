# 🗺️ User Flow Document
## SI-APARAT — Sistem Informasi & Aspirasi Taruna

> **Versi:** 1.0.0  
> **Tanggal:** 5 Agustus 2026

---

## 1. UF-01: Alur Kirim Aspirasi (Taruna Anonim)
1. **Entry Point:** Taruna memindai QR Code di area kesatriaan (asrama/toilet/mading).
2. **Landing Page:** Membuka URL `aparat.namasekolah.sch.id` tanpa perlu login.
3. **Pilih Kategori:** Memilih Sarana, Kegiatan, Perundungan (ditandai alert merah), atau Lainnya.
4. **Isi Form:** Menulis detail (min 20 max 2000 karakter). Boleh mengunggah foto max 3x5MB.
5. **Submit:** Mencentang "Saya memahami laporan anonim", lalu tekan Kirim.
6. **Kode Tracking:** Taruna mendapatkan kode unik (misal: `APR-20260805-7X3K`) dan wajib menyimpannya/screenshot.

---

## 2. UF-02: Alur Cek Status Laporan (Taruna Anonim)
1. **Akses:** Buka beranda SI-APARAT, pilih "Cek Status Laporan".
2. **Input:** Masukkan kode tracking (misal: `APR-20260805-7X3K`).
3. **Hasil:** Menampilkan Status saat ini (DIPROSES/SELESAI), Timeline waktu perubahan status, dan balasan pesan anonim dari MPK.

---

## 3. UF-03: Alur Dashboard MPK
1. **Login:** MPK login menggunakan username dan password resmi.
2. **Dashboard:** Melihat ringkasan data (misal: "Ada 5 laporan BARU, 3 di antaranya PERUNDUNGAN").
3. **Tindakan:** MPK klik laporan. Laporan didekripsi dan dibaca.
4. **Aksi Tersedia:** 
   * Ubah status (BARU -> DIPROSES).
   * Kirim balasan anonim ke pelapor (akan muncul saat Taruna cek status).
   * **Eskalasi ke Pembina:** Menekan tombol ini otomatis meneruskan laporan valid ke dashboard Pembina (status berubah menjadi DITERUSKAN).

---

## 4. UF-04: Alur Dashboard Pembina
1. **Login:** Pembina login. Sistem mendeteksi Role = PEMBINA.
2. **List Terbatas:** Hanya menampilkan laporan yang statusnya sudah di-eskalasi oleh MPK.
3. **Tindak Lanjut:** Pembina membaca, bertindak di lapangan, dan mencatat log: "Sudah ditangani wali kelas" di sistem. (MPK kemudian akan mengubah status menjadi SELESAI).
