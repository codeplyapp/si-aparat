import type {
  SubmitAspirasiResponse,
  TrackingResponse,
  LoginResponse,
  KategoriLaporan,
  StatusLaporan,
  StatusMatriks,
  RoleUser,
  UpdateMatriksRequest,
} from '@si-aparat/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'https://si-aparat.onrender.com/api/v1';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Submit aspirasi anonim */
export async function submitAspirasi(
  kategori: KategoriLaporan,
  konten: string,
  fotos: File[],
  options?: {
    honeypot?: string;
    formTimestamp?: number;
  },
): Promise<SubmitAspirasiResponse> {
  const formData = new FormData();
  formData.append('kategori', kategori);
  formData.append('konten', konten);

  if (options?.honeypot) {
    formData.append('website', options.honeypot);
  }
  if (options?.formTimestamp) {
    formData.append('_ts', options.formTimestamp.toString());
  }
  
  fotos.forEach((foto) => {
    formData.append('foto', foto);
  });

  const res = await fetch(`${API_BASE}/aspirasi`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Gagal mengirim aspirasi', res.status);
  }

  return data;
}

/** Cek status laporan via Kode Tracking */
export async function getTrackingStatus(kodeTracking: string): Promise<TrackingResponse> {
  const cleanKode = kodeTracking.trim().toUpperCase();
  const res = await fetch(`${API_BASE}/aspirasi/tracking/${encodeURIComponent(cleanKode)}`);
  
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Kode tracking tidak ditemukan', res.status);
  }

  return data;
}

export interface PublicStatsResponse {
  totalLaporan: number;
  sedangDiproses: number;
  sudahDitangani: number;
}

/** Ambil statistik publik laporan */
export async function getPublicStats(): Promise<PublicStatsResponse> {
  const res = await fetch(`${API_BASE}/aspirasi/stats`);
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Gagal mengambil statistik', res.status);
  }
  return data;
}


/** Login Petugas MPK / Pembina / Admin */
export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  const controller = new AbortController();
  // 45s timeout untuk mentoleransi cold-start Render Free Tier (spin-up 15-30s)
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data.message || 'Login gagal', res.status);
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Server API sedang melakukan booting (Render Cold Start). Silakan tunggu sebentar dan coba klik Login kembali.', 504);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'Gagal terhubung ke Backend API. Pastikan VITE_API_URL diset di Vercel & Backend API di Render sudah aktif.',
      500
    );
  }
}

// ─── MPK Endpoints ─────────────────────────────────────────────────────────

export interface LaporanItemMPK {
  id: string;
  kodeTracking: string;
  kategori: KategoriLaporan;
  status: StatusLaporan;
  isEskalasi: boolean;
  skorDampak: number | null;
  skorKelayakan: number | null;
  isMelanggarAturan: boolean;
  statusMatriks: StatusMatriks | null;
  catatanTindakLanjut: string | null;
  matriksUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { lampiran: number };
}

export interface LaporanDetailMPK extends LaporanItemMPK {
  konten: string;
  lampiran: Array<{
    id: string;
    mimeType: string;
    fileSizeBytes: number;
    downloadUrl: string;
  }>;
  balasan: { id: string; pesan: string; createdAt: string } | null;
  catatan: Array<{
    id: string;
    catatan: string;
    createdAt: string;
    author: { namaLengkap: string; role: RoleUser };
  }>;
}

export async function getLaporanListMPK(filters?: {
  status?: string;
  kategori?: string;
  statusMatriks?: string;
}): Promise<{ data: LaporanItemMPK[]; pagination: { total: number } }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.kategori) params.set('kategori', filters.kategori);
  if (filters?.statusMatriks) params.set('statusMatriks', filters.statusMatriks);
  const query = params.toString();
  const res = await fetch(`${API_BASE}/mpk/laporan?${query}`, {
    headers: getAuthHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(data.message || 'Gagal mengambil data', res.status);
  return data;
}

export async function getLaporanDetailMPK(id: string): Promise<LaporanDetailMPK> {
  const res = await fetch(`${API_BASE}/mpk/laporan/${id}`, {
    headers: getAuthHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(data.message || 'Gagal mengambil detail', res.status);
  return data;
}

export async function updateStatusMPK(id: string, status: StatusLaporan): Promise<void> {
  const res = await fetch(`${API_BASE}/mpk/laporan/${id}/status`, {
    method: 'PATCH',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message || 'Gagal mengubah status', res.status);
  }
}

export async function updateMatriksMPK(
  id: string,
  payload: UpdateMatriksRequest,
): Promise<{ message: string; laporan: LaporanItemMPK }> {
  const res = await fetch(`${API_BASE}/mpk/laporan/${id}/matriks`, {
    method: 'PATCH',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Gagal menyimpan penilaian matriks', res.status);
  }
  return data;
}

export async function exportMatriksCSV(filters?: {
  status?: string;
  kategori?: string;
  statusMatriks?: string;
}): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.kategori) params.set('kategori', filters.kategori);
  if (filters?.statusMatriks) params.set('statusMatriks', filters.statusMatriks);
  const query = params.toString();

  const res = await fetch(`${API_BASE}/mpk/export/matriks.csv?${query}`, {
    headers: getAuthHeader(),
  });

  if (!res.ok) {
    let errorMsg = 'Gagal mengekspor CSV';
    try {
      const err = await res.json();
      errorMsg = err.message || errorMsg;
    } catch {
      // fallback
    }
    throw new ApiError(errorMsg, res.status);
  }

  return await res.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function eskalasiMPK(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/mpk/laporan/${id}/eskalasi`, {
    method: 'POST',
    headers: getAuthHeader(),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message || 'Gagal meneruskan laporan', res.status);
  }
}

export async function sendBalasanMPK(id: string, pesan: string): Promise<void> {
  const res = await fetch(`${API_BASE}/mpk/laporan/${id}/balasan`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ pesan }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message || 'Gagal mengirim balasan', res.status);
  }
}

// ─── Pembina Endpoints ─────────────────────────────────────────────────────

export interface LaporanDetailPembina {
  id: string;
  kodeTracking: string;
  kategori: KategoriLaporan;
  status: StatusLaporan;
  konten: string;
  jumlahFoto: number;
  catatan: Array<{
    id: string;
    catatan: string;
    createdAt: string;
    author: { namaLengkap: string; role: RoleUser };
  }>;
  balasan: { id: string; pesan: string } | null;
  createdAt: string;
  updatedAt: string;
}

export async function getLaporanListPembina(): Promise<{ data: LaporanItemMPK[] }> {
  const res = await fetch(`${API_BASE}/pembina/laporan`, {
    headers: getAuthHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(data.message || 'Gagal mengambil data', res.status);
  return data;
}

export async function getLaporanDetailPembina(id: string): Promise<LaporanDetailPembina> {
  const res = await fetch(`${API_BASE}/pembina/laporan/${id}`, {
    headers: getAuthHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(data.message || 'Gagal mengambil detail', res.status);
  return data;
}

export async function addCatatanPembina(id: string, catatan: string): Promise<void> {
  const res = await fetch(`${API_BASE}/pembina/laporan/${id}/catatan`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ catatan }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message || 'Gagal menyimpan catatan', res.status);
  }
}

// ─── Admin Endpoints ───────────────────────────────────────────────────────

export interface UserItemAdmin {
  id: string;
  username: string;
  namaLengkap: string;
  email: string;
  role: RoleUser;
  createdAt: string;
}

export async function getUserListAdmin(): Promise<{ data: UserItemAdmin[] }> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(data.message || 'Gagal mengambil data user', res.status);
  return data;
}

export async function createUserAdmin(payload: {
  username: string;
  password: string;
  namaLengkap: string;
  email: string;
  role: RoleUser;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message || 'Gagal membuat user', res.status);
  }
}

export async function deleteUserAdmin(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.message || 'Gagal menghapus user', res.status);
  }
}
