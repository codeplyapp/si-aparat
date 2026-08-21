// Enums / Const Objects for compatibility with modern TS erasableSyntaxOnly

export const RoleUser = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MPK: 'MPK',
  PEMBINA: 'PEMBINA',
} as const;
export type RoleUser = (typeof RoleUser)[keyof typeof RoleUser];

export const KategoriLaporan = {
  SARANA: 'SARANA',
  KEGIATAN: 'KEGIATAN',
  PERUNDUNGAN: 'PERUNDUNGAN',
  LAINNYA: 'LAINNYA',
} as const;
export type KategoriLaporan = (typeof KategoriLaporan)[keyof typeof KategoriLaporan];

export const StatusLaporan = {
  BARU: 'BARU',
  DIPROSES: 'DIPROSES',
  DITERUSKAN: 'DITERUSKAN',
  SELESAI: 'SELESAI',
} as const;
export type StatusLaporan = (typeof StatusLaporan)[keyof typeof StatusLaporan];

export const StatusMatriks = {
  PRIORITAS_UTAMA: 'PRIORITAS_UTAMA',
  ADVOKASI: 'ADVOKASI',
  DELEGASI_OSIS: 'DELEGASI_OSIS',
  ARSIP: 'ARSIP',
} as const;
export type StatusMatriks = (typeof StatusMatriks)[keyof typeof StatusMatriks];

// ---- API Request / Response Types ----

export interface SubmitAspirasiRequest {
  kategori: KategoriLaporan;
  konten: string;
}

export interface SubmitAspirasiResponse {
  kodeTracking: string;
  message: string;
}

export interface TrackingResponse {
  kodeTracking: string;
  kategori: KategoriLaporan;
  status: StatusLaporan;
  timeline: TrackingTimeline[];
  balasan: BalasanPublik | null;
}

export interface TrackingTimeline {
  status: StatusLaporan;
  timestamp: string;
}

export interface BalasanPublik {
  pesan: string;
  timestamp: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: RoleUser;
  namaLengkap: string;
  expiresAt: string;
}

export interface UpdateStatusRequest {
  status: StatusLaporan;
}

export interface SendBalasanRequest {
  pesan: string;
}

export interface CatatanTindakLanjutRequest {
  catatan: string;
}

export interface UpdateMatriksRequest {
  skorDampak?: number | null;
  skorKelayakan?: number | null;
  isMelanggarAturan?: boolean;
  catatanTindakLanjut?: string | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  namaLengkap: string;
  email: string;
  role: typeof RoleUser.MPK | typeof RoleUser.PEMBINA;
}

// ---- UI Helpers & Matriks Calculation ----

export const KATEGORI_LABELS: Record<KategoriLaporan, string> = {
  [KategoriLaporan.SARANA]: 'Sarana & Prasarana',
  [KategoriLaporan.KEGIATAN]: 'Kegiatan',
  [KategoriLaporan.PERUNDUNGAN]: 'Perundungan / Bullying',
  [KategoriLaporan.LAINNYA]: 'Lainnya',
};

export const STATUS_LABELS: Record<StatusLaporan, string> = {
  [StatusLaporan.BARU]: 'Baru Diterima',
  [StatusLaporan.DIPROSES]: 'Sedang Diproses',
  [StatusLaporan.DITERUSKAN]: 'Diteruskan ke Pembina',
  [StatusLaporan.SELESAI]: 'Selesai Ditangani',
};

export const STATUS_MATRIKS_LABELS: Record<StatusMatriks, string> = {
  [StatusMatriks.PRIORITAS_UTAMA]: '🟢 Prioritas Utama',
  [StatusMatriks.ADVOKASI]: '🟡 Advokasi',
  [StatusMatriks.DELEGASI_OSIS]: '🔵 Delegasi OSIS',
  [StatusMatriks.ARSIP]: '🔴 Arsip',
};

export const SKOR_DAMPAK_LABELS: Record<number, string> = {
  1: '1 - Rendah (Dampak terbatas / minor / individu)',
  2: '2 - Sedang (Dampak pada satu angkatan / area tertentu)',
  3: '3 - Tinggi (Dampak mayoritas taruna / fasilitas vital)',
  4: '4 - Kritis (Dampak seluruh korps / keselamatan / operasional)',
};

export const SKOR_KELAYAKAN_LABELS: Record<number, string> = {
  1: '1 - Sangat Sulit (Butuh biaya besar / kebijakan eksternal)',
  2: '2 - Cukup Sulit (Butuh koordinasi signifikan / biaya menengah)',
  3: '3 - Layak (Dapat dieksekusi dengan sumber daya yang ada)',
  4: '4 - Sangat Layak (Quick win / perubahan mudah / mandiri)',
};

export interface HitungStatusMatriksParams {
  kategori: KategoriLaporan;
  isMelanggarAturan?: boolean | null;
  skorDampak?: number | null;
  skorKelayakan?: number | null;
}

/**
 * Logika evaluasi Status Final Matriks Pleno MPK (first-match wins):
 * 1. Melanggar aturan -> ARSIP
 * 2. Kategori PERUNDUNGAN -> PRIORITAS_UTAMA (selalu eskalasi)
 * 3. Kategori KEGIATAN -> DELEGASI_OSIS
 * 4. Skor lengkap (1-4):
 *    - Dampak >= 3 & Kelayakan >= 3 -> PRIORITAS_UTAMA
 *    - Dampak >= 3 & Kelayakan <= 2 -> ADVOKASI
 *    - Dampak <= 2 -> ARSIP
 * 5. Belum dinilai -> null
 */
export function hitungStatusMatriks(params: HitungStatusMatriksParams): StatusMatriks | null {
  if (params.isMelanggarAturan) {
    return StatusMatriks.ARSIP;
  }

  if (params.kategori === KategoriLaporan.PERUNDUNGAN) {
    return StatusMatriks.PRIORITAS_UTAMA;
  }

  if (params.kategori === KategoriLaporan.KEGIATAN) {
    return StatusMatriks.DELEGASI_OSIS;
  }

  const d = params.skorDampak;
  const k = params.skorKelayakan;

  if (typeof d === 'number' && typeof k === 'number' && d >= 1 && d <= 4 && k >= 1 && k <= 4) {
    if (d >= 3 && k >= 3) {
      return StatusMatriks.PRIORITAS_UTAMA;
    }
    if (d >= 3 && k <= 2) {
      return StatusMatriks.ADVOKASI;
    }
    if (d <= 2) {
      return StatusMatriks.ARSIP;
    }
  }

  return null;
}

export const KONTEN_MIN_LENGTH = 20;
export const KONTEN_MAX_LENGTH = 2000;
export const MAX_FOTO_SIZE_MB = 5;
export const MAX_FOTO_COUNT = 3;
export const ALLOWED_FOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];
