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

export interface CreateUserRequest {
  username: string;
  password: string;
  namaLengkap: string;
  email: string;
  role: typeof RoleUser.MPK | typeof RoleUser.PEMBINA;
}

// ---- UI Helpers ----

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

export const KONTEN_MIN_LENGTH = 20;
export const KONTEN_MAX_LENGTH = 2000;
export const MAX_FOTO_SIZE_MB = 5;
export const MAX_FOTO_COUNT = 3;
export const ALLOWED_FOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];
