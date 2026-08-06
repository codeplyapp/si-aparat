# 🏗️ Technical Specification Document (TSD)
## SI-APARAT — Sistem Informasi & Aspirasi Taruna

> **Versi:** 1.0.0  
> **Tanggal:** 5 Agustus 2026

---

## 1. Arsitektur Keseluruhan
Sistem ini menggunakan arsitektur web modern yang dirancang untuk anonimitas maksimum:
*   **Client/Browser:** React 18 + Vite (SPA) — diakses via scan QR.
*   **API Gateway:** Nginx (SSL Termination, Rate Limiting).
*   **Backend API:** Node.js 20 + Fastify + TypeScript.
*   **Database:** PostgreSQL 16 dengan Prisma ORM.

---

## 2. Skema Keamanan & Anonimitas
1.  **Anonymize Request Middleware:**
    Setiap request publik (form aspirasi) yang masuk ke Backend akan dilewati ke middleware yang me-reset `req.ip = '0.0.0.0'` dan menghapus header `User-Agent`.
2.  **Data Encryption (AES-256-GCM):**
    Field `konten` pada database tidak disimpan plaintext. Dienkripsi di level aplikasi Node.js sebelum masuk PostgreSQL.
3.  **Metadata Removal:**
    Foto yang diunggah akan divalidasi `magic bytes`-nya dan diproses untuk menghilangkan EXIF/GPS data jika diperlukan (menggunakan image processing library).

---

## 3. Database Schema (Prisma)
```prisma
model User {
  id           String    @id @default(uuid())
  username     String    @unique
  passwordHash String
  role         RoleUser  // MPK, PEMBINA
  namaLengkap  String
}

model Laporan {
  id           String          @id @default(uuid())
  kodeTracking String          @unique
  kategori     KategoriLaporan // SARANA, KEGIATAN, PERUNDUNGAN, LAINNYA
  konten       String          // Encrypted AES-256
  status       StatusLaporan   // BARU, DIPROSES, DITERUSKAN, SELESAI
  isEskalasi   Boolean         @default(false)
  lampiran     LampiranFoto[]
}
```

---

## 4. REST API Endpoint Utama
*   `POST /api/v1/aspirasi` — Submit laporan baru. Mengembalikan Kode Tracking.
*   `GET /api/v1/aspirasi/tracking/:kodeTracking` — Mengambil status dan balasan.
*   `POST /api/v1/auth/login` — Autentikasi MPK/Pembina.
*   `PATCH /api/v1/mpk/laporan/:id/status` — MPK mengubah status.
*   `POST /api/v1/mpk/laporan/:id/eskalasi` — Meneruskan kasus ke Pembina.

---

## 5. Deployment
*   **Server:** VPS Ubuntu 22.04 LTS.
*   **Proses:** PM2 (Node.js) & Docker Compose untuk Database.
*   **Koneksi:** Wajib HTTPS (Let's Encrypt).
