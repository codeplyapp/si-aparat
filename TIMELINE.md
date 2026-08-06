# 📅 Timeline Proyek
## SI-APARAT — Sistem Informasi & Aspirasi Taruna

> **Tanggal Mulai:** 6 Agustus 2026  
> **Target Launch:** 31 Oktober 2026  
> **Durasi:** ~12 Minggu (Agile, 2 minggu per sprint)

---

## 1. Jadwal Milestone (Agustus - Oktober 2026)

| Fase | Tanggal Target | Fokus Pekerjaan |
|---|---|---|
| **Fase 0 (Setup)** | 6 - 9 Agt 2026 | Repo GitHub, Docker Compose, DB Schema, Privacy Sign-off. |
| **Sprint 1** | 11 - 22 Agt 2026 | **Core Backend:** API aspirasi, enkripsi AES-256, auth MPK, Zero-log IP, rate limiting. |
| **Sprint 2** | 25 Agt - 5 Sep | **Frontend Publik:** Landing page, Form aspirasi responsive, halaman Tracking. |
| **Sprint 3** | 8 - 19 Sep 2026 | **Dashboard MPK:** UI Dashboard, filter status, fitur balasan, eskalasi. |
| **Sprint 4** | 22 Sep - 3 Okt | **Dashboard Pembina:** UI Pembina, Security hardening (Anti-XSS, anti SQLi), QR Code generator. |
| **Fase QA** | 6 - 10 Okt 2026 | Full E2E Test, Server Load Test, Bug Fixing Critical. |
| **Fase UAT** | 13 - 17 Okt 2026 | Pilot testing (10 Taruna, 3 MPK, 1 Pembina). Fix UX Feedback. |
| **LAUNCH** | **31 Okt 2026** | **Go Live!** Deploy Production, Sebar QR Code di area strategis. |

---

## 2. Alokasi Sumber Daya
*   **Product Owner:** 1 Orang (MPK/Pembina) — Validasi dan Sign-off.
*   **Tech Lead:** 1 Orang — Arsitektur & DevOps VPS.
*   **Backend Dev:** 1-2 Orang — API, Enkripsi, DB Prisma.
*   **Frontend Dev:** 1-2 Orang — React UI, UX Mobile-first.
*   **QA Engineer:** 1 Orang — Security Test & Automation E2E.

## 3. Mitigasi Risiko
*   **Risiko:** Partisipasi Taruna rendah karena ketidakpercayaan.
    *   *Mitigasi:* Kampanye MPK massif, demonstrasi (simulasi nyata) saat apel pagi, transparansi algoritma tanpa pelacakan IP.
*   **Risiko:** Spam Laporan / Laporan Palsu.
    *   *Mitigasi:* Rate Limiting 5x per hari, Kurasi MPK sebelum di-eskalasi ke Pembina.
