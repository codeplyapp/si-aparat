import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import {
  RoleUser,
  KategoriLaporan,
  StatusLaporan,
  StatusMatriks,
  KATEGORI_LABELS,
  STATUS_LABELS,
  STATUS_MATRIKS_LABELS,
} from '@si-aparat/shared';
import {
  getUserListAdmin,
  createUserAdmin,
  deleteUserAdmin,
  getLaporanListMPK,
  getLaporanDetailMPK,
  type UserItemAdmin,
  type LaporanItemMPK,
  type LaporanDetailMPK,
  ApiError,
} from '../lib/api';
import {
  UserPlus,
  Trash2,
  QrCode,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Printer,
  Users,
  FileText,
  Eye,
  Image as ImageIcon,
  Filter,
} from 'lucide-react';
import mpkLogo from '../assets/logo-mpk.png';

const ROLE_LABELS: Record<RoleUser, string> = {
  [RoleUser.SUPER_ADMIN]: 'Super Admin',
  [RoleUser.MPK]: 'MPK',
  [RoleUser.PEMBINA]: 'Pengasuh Pembina',
};

export const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab: 'users' | 'laporan'
  const [activeTab, setActiveTab] = useState<'users' | 'laporan'>('users');

  // Users State
  const [users, setUsers] = useState<UserItemAdmin[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State Create User
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleUser>(RoleUser.MPK);
  const [formLoading, setFormLoading] = useState(false);

  // Modal QR Poster State
  const [showQrModal, setShowQrModal] = useState(false);

  // Laporan State (Tab 2)
  const [laporanList, setLaporanList] = useState<LaporanItemMPK[]>([]);
  const [laporanLoading, setLaporanLoading] = useState<boolean>(false);
  const [laporanError, setLaporanError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [filterStatusMatriks, setFilterStatusMatriks] = useState<string>('');

  // Selected Detail Laporan Modal
  const [selectedLaporanId, setSelectedLaporanId] = useState<string | null>(null);
  const [detailLaporan, setDetailLaporan] = useState<LaporanDetailMPK | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setErrorMsg(null);
    try {
      const res = await getUserListAdmin();
      setUsers(res.data);
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg('Gagal memuat daftar pengguna.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchLaporan = useCallback(async () => {
    setLaporanLoading(true);
    setLaporanError(null);
    try {
      const res = await getLaporanListMPK({
        status: filterStatus || undefined,
        kategori: filterKategori || undefined,
        statusMatriks: filterStatusMatriks || undefined,
        limit: 100,
      });
      setLaporanList(res.data);
    } catch (err) {
      if (err instanceof ApiError) setLaporanError(err.message);
      else setLaporanError('Gagal memuat daftar laporan.');
    } finally {
      setLaporanLoading(false);
    }
  }, [filterStatus, filterKategori, filterStatusMatriks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeTab === 'laporan') {
      fetchLaporan();
    }
  }, [activeTab, fetchLaporan]);

  const openDetailLaporan = async (id: string) => {
    setSelectedLaporanId(id);
    setDetailLoading(true);
    setDetailLaporan(null);
    try {
      const data = await getLaporanDetailMPK(id);
      setDetailLaporan(data);
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createUserAdmin({ username, password, namaLengkap, email, role });
      setSuccessMsg(`Akun petugas '${username}' (${ROLE_LABELS[role]}) berhasil dibuat!`);
      setUsername('');
      setPassword('');
      setNamaLengkap('');
      setEmail('');
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg('Gagal membuat akun.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Hapus akun petugas '${name}'?`)) return;
    try {
      await deleteUserAdmin(id);
      setSuccessMsg(`Akun '${name}' telah dihapus.`);
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getStatusBadge = (status: StatusLaporan) => {
    const classMap: Record<StatusLaporan, string> = {
      [StatusLaporan.BARU]: 'neo-badge-yellow',
      [StatusLaporan.DIPROSES]: 'neo-badge-orange',
      [StatusLaporan.DITERUSKAN]: 'neo-badge-purple',
      [StatusLaporan.SELESAI]: 'neo-badge-mint',
    };
    return <span className={`neo-badge ${classMap[status]}`}>{STATUS_LABELS[status]}</span>;
  };

  const getMatriksBadge = (status: StatusMatriks | null) => {
    if (!status) {
      return (
        <span
          className="neo-badge"
          style={{ background: '#e2e8f0', color: '#475569', borderColor: '#64748b' }}
        >
          ⚪ Belum Dinilai
        </span>
      );
    }

    const classMap: Record<StatusMatriks, string> = {
      [StatusMatriks.PRIORITAS_UTAMA]: 'neo-badge-green',
      [StatusMatriks.ADVOKASI]: 'neo-badge-yellow',
      [StatusMatriks.DELEGASI_OSIS]: 'neo-badge-mint',
      [StatusMatriks.ARSIP]: 'neo-badge-pink',
    };

    return <span className={`neo-badge ${classMap[status]}`}>{STATUS_MATRIKS_LABELS[status]}</span>;
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neo-text)' }}>
            Panel Super Admin
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowQrModal(true)} className="neo-btn-mint" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <QrCode size={18} strokeWidth={2.5} />
            <span>Cetak QR Poster</span>
          </button>
          <button
            onClick={() => {
              if (activeTab === 'users') fetchUsers();
              else fetchLaporan();
            }}
            className="neo-btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <RefreshCw size={18} strokeWidth={2.5} />
            <span>Refresh</span>
          </button>
          <button onClick={handleLogout} className="neo-btn-danger" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <LogOut size={18} strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '3px solid #000000', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('users')}
          className="font-display"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: '3px solid #000000',
            background: activeTab === 'users' ? '#ffe600' : 'var(--neo-card-bg)',
            color: '#000000',
            fontWeight: 900,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'users' ? '4px 4px 0px 0px #000000' : 'none',
          }}
        >
          <Users size={18} strokeWidth={2.5} />
          <span>Kelola Petugas ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className="font-display"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: '3px solid #000000',
            background: activeTab === 'laporan' ? '#00f0ff' : 'var(--neo-card-bg)',
            color: '#000000',
            fontWeight: 900,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'laporan' ? '4px 4px 0px 0px #000000' : 'none',
          }}
        >
          <FileText size={18} strokeWidth={2.5} />
          <span>Monitoring Laporan & Foto Bukti</span>
        </button>
      </div>

      {/* TAB 1: KELOLA PETUGAS */}
      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Form Tambah Akun */}
          <div className="neo-card" style={{ padding: '2rem', background: 'var(--neo-card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '3px solid #000000', paddingBottom: '1rem' }}>
              <UserPlus size={24} strokeWidth={2.5} color="var(--neo-text)" />
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--neo-text)' }}>
                Buat Akun Petugas
              </h3>
            </div>

            {errorMsg && (
              <div className="neo-card-pink" style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                <AlertTriangle size={18} strokeWidth={2.5} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="neo-card-mint" style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: '#000000' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--neo-text)' }}>
                  Username (lowercase & angka)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="misal: mpk_ketua"
                  className="neo-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--neo-text)' }}>
                  Nama Lengkap Petugas
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="misal: Taruna M. Rizky"
                  className="neo-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--neo-text)' }}>
                  Email Resmi Notifikasi
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="misal: mpk@sman2tb.sch.id"
                  className="neo-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--neo-text)' }}>
                  Password (min 8 char, KAPITAL & angka)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="misal: Aparat2026!"
                  className="neo-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px', color: 'var(--neo-text)' }}>
                  Role Hak Akses
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleUser)}
                  className="neo-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                >
                  <option value={RoleUser.MPK}>MPK (Moderator Laporan)</option>
                  <option value={RoleUser.PEMBINA}>PEMBINA (Pengasuh Asrama)</option>
                </select>
              </div>

              <button type="submit" disabled={formLoading} className="neo-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <span>{formLoading ? 'Membuat...' : 'Buat Akun Sekarang'}</span>
              </button>
            </form>
          </div>

          {/* Tabel Daftar User */}
          <div className="neo-card" style={{ padding: '2rem', background: 'var(--neo-card-bg)' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem', borderBottom: '3px solid #000000', paddingBottom: '1rem', color: 'var(--neo-text)' }}>
              Daftar Petugas Terdaftar ({users.length})
            </h3>

            {usersLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
                Memuat user...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', color: 'var(--neo-text)' }}>
                  <thead>
                    <tr style={{ borderBottom: '3px solid #000000', background: 'var(--neo-bg)' }}>
                      <th className="font-display" style={{ padding: '10px 12px', fontWeight: 800 }}>User / Nama</th>
                      <th className="font-display" style={{ padding: '10px 12px', fontWeight: 800 }}>Role</th>
                      <th className="font-display" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSuper = u.role === RoleUser.SUPER_ADMIN;
                      const badgeClass = isSuper ? 'neo-badge-yellow' : u.role === RoleUser.PEMBINA ? 'neo-badge-purple' : 'neo-badge-mint';

                      return (
                        <tr key={u.id} style={{ borderBottom: '2px solid rgba(150, 150, 150, 0.2)' }}>
                          <td style={{ padding: '12px' }}>
                            <strong className="font-mono" style={{ color: 'var(--neo-text)', display: 'block' }}>@{u.username}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--neo-text-muted)', fontWeight: 600 }}>{u.namaLengkap}</span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`neo-badge ${badgeClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                              {ROLE_LABELS[u.role]}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {!isSuper && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                style={{ background: 'none', border: 'none', color: '#ff3b5c', cursor: 'pointer', padding: '4px' }}
                                title="Hapus Akun"
                              >
                                <Trash2 size={18} strokeWidth={2.5} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONITORING LAPORAN & FOTO BUKTI */}
      {activeTab === 'laporan' && (
        <div>
          {/* Filter Bar */}
          <div className="neo-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', background: 'var(--neo-card-bg)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neo-text)', fontSize: '0.95rem', fontWeight: 800 }} className="font-display">
              <Filter size={20} strokeWidth={2.5} color="var(--neo-text)" />
              <span>Filter Monitoring:</span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="neo-input"
              style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '0.9rem' }}
            >
              <option value="">Semua Status Laporan</option>
              {Object.keys(StatusLaporan).map((st) => (
                <option key={st} value={st}>{STATUS_LABELS[st as StatusLaporan]}</option>
              ))}
            </select>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="neo-input"
              style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '0.9rem' }}
            >
              <option value="">Semua Kategori</option>
              {Object.keys(KategoriLaporan).map((kat) => (
                <option key={kat} value={kat}>{KATEGORI_LABELS[kat as KategoriLaporan]}</option>
              ))}
            </select>
            <select
              value={filterStatusMatriks}
              onChange={(e) => setFilterStatusMatriks(e.target.value)}
              className="neo-input"
              style={{ width: 'auto', minWidth: '170px', padding: '8px 12px', fontSize: '0.9rem' }}
            >
              <option value="">Semua Status Matriks</option>
              {Object.keys(StatusMatriks).map((sm) => (
                <option key={sm} value={sm}>{STATUS_MATRIKS_LABELS[sm as StatusMatriks]}</option>
              ))}
              <option value="BELUM_DINILAI">⚪ Belum Dinilai</option>
            </select>
          </div>

          {/* Table Data Laporan */}
          {laporanLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
              ⏳ Memuat data laporan & lampiran foto...
            </div>
          ) : laporanError ? (
            <div className="neo-card-pink" style={{ padding: '1.5rem', textAlign: 'center', fontWeight: 800 }}>{laporanError}</div>
          ) : laporanList.length === 0 ? (
            <div className="neo-card font-display" style={{ padding: '3rem', textAlign: 'center', color: 'var(--neo-text-muted)', background: 'var(--neo-card-bg)', fontWeight: 700 }}>
              Belum ada laporan yang sesuai dengan filter saat ini.
            </div>
          ) : (
            <div className="neo-card" style={{ overflowX: 'auto', background: 'var(--neo-card-bg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem', color: 'var(--neo-text)' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #000000', background: 'var(--neo-bg)' }}>
                    <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Kode Tracking</th>
                    <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Kategori</th>
                    <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Tanggal</th>
                    <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Status</th>
                    <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Matriks Pleno</th>
                    <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Foto Bukti</th>
                    <th className="font-display" style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 800 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {laporanList.map((item) => {
                    const isBully = item.kategori === KategoriLaporan.PERUNDUNGAN;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '2px solid rgba(150, 150, 150, 0.2)',
                          background: isBully ? 'rgba(255, 59, 92, 0.18)' : 'transparent',
                        }}
                      >
                        <td className="font-mono" style={{ padding: '16px 18px', fontWeight: 900, color: 'var(--neo-text)' }}>
                          {item.kodeTracking}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ color: isBully ? 'var(--neo-pink)' : 'var(--neo-text)', fontWeight: isBully ? 800 : 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {isBully && <AlertTriangle size={16} strokeWidth={2.5} color="var(--neo-pink)" />}
                            {KATEGORI_LABELS[item.kategori]}
                          </span>
                        </td>
                        <td style={{ padding: '16px 18px', color: 'var(--neo-text-muted)', fontWeight: 600 }}>
                          {new Date(item.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          {getStatusBadge(item.status)}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          {getMatriksBadge(item.statusMatriks)}
                        </td>
                        <td style={{ padding: '16px 18px', color: 'var(--neo-text-muted)' }}>
                          {item._count && item._count.lampiran > 0 ? (
                            <span className="neo-badge neo-badge-mint" style={{ fontSize: '0.75rem' }}>
                              <ImageIcon size={14} strokeWidth={2.5} /> {item._count.lampiran} foto bukti
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => openDetailLaporan(item.id)}
                            className="neo-btn-primary"
                            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          >
                            <Eye size={16} strokeWidth={2.5} />
                            <span>Lihat Laporan & Bukti</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Laporan & Bukti Foto untuk Super Admin */}
      <Modal
        isOpen={Boolean(selectedLaporanId)}
        onClose={() => setSelectedLaporanId(null)}
        title={detailLaporan?.kodeTracking || 'Detail Laporan Masuk'}
        subtitle={
          detailLaporan ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--neo-text-muted)', marginTop: '2px', fontWeight: 600 }}>
              Kategori: <strong style={{ color: 'var(--neo-text)' }}>{KATEGORI_LABELS[detailLaporan.kategori]}</strong>
            </p>
          ) : undefined
        }
        shadowColor="#00f0ff"
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
            🔓 Mendekripsi konten & memuat presigned URL foto...
          </div>
        ) : detailLaporan ? (
          <div>
            {/* Status & Info Badge */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <span className="font-display" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--neo-text)' }}>
                Status Saat Ini:
              </span>
              {getStatusBadge(detailLaporan.status)}
              {getMatriksBadge(detailLaporan.statusMatriks)}
            </div>

            {/* Decrypted Content Box */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                Isi Laporan Masuk
              </h4>
              <div
                className="neo-card-white"
                style={{
                  padding: '1.5rem',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontWeight: 600,
                  boxShadow: '5px 5px 0px 0px #00f0ff',
                  background: 'var(--neo-bg)',
                }}
              >
                {detailLaporan.konten}
              </div>
            </div>

            {/* Foto Lampiran Bukti */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                Foto Bukti Lampiran ({detailLaporan.lampiran.length})
              </h4>
              {detailLaporan.lampiran.length === 0 ? (
                <div className="neo-card" style={{ padding: '14px 18px', background: 'var(--neo-bg)', fontSize: '0.875rem', color: 'var(--neo-text-muted)', fontStyle: 'italic', fontWeight: 600 }}>
                  Tidak ada foto bukti yang dilampirkan oleh pelapor pada laporan ini.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {detailLaporan.lampiran.map((foto, idx) => (
                    <div key={idx} className="neo-card" style={{ padding: '10px', background: 'var(--neo-bg)', textAlign: 'center', boxShadow: '3px 3px 0px 0px #00f0ff' }}>
                      <a href={foto.downloadUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '8px' }}>
                        <img
                          src={foto.downloadUrl}
                          alt={`Foto Bukti ${idx + 1}`}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #000000' }}
                          loading="lazy"
                        />
                      </a>
                      <a
                        href={foto.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                      >
                        <ImageIcon size={14} strokeWidth={2.5} />
                        <span>Buka Foto {idx + 1} ({Math.round(foto.fileSizeBytes / 1024)} KB)</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catatan Tindak Lanjut MPK/Pembina */}
            {detailLaporan.catatan && detailLaporan.catatan.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                  Log Catatan Tindak Lanjut Petugas
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {detailLaporan.catatan.map((c) => (
                    <div key={c.id} className="neo-card" style={{ padding: '12px 16px', background: 'var(--neo-bg)' }}>
                      <p style={{ color: 'var(--neo-text)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{c.catatan}</p>
                      <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--neo-text-muted)' }}>
                        Oleh: <strong>{c.author.namaLengkap}</strong> ({ROLE_LABELS[c.author.role]}) - {new Date(c.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal QR Code Poster (Printable Light Neo-Brutalist) */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        maxWidth="500px"
        shadowColor="#ffe600"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img src={mpkLogo} alt="MPK Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
          </div>

          <h2 className="font-display" style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--neo-text)' }}>
            POSTER ASPIRASI TARUNA
          </h2>
          <p className="font-display" style={{ fontSize: '0.85rem', color: 'var(--neo-text-muted)', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            SMAN 2 TARUNA BHAYANGKARA JAWA TIMUR
          </p>

          {/* Simulated Printed QR Canvas */}
          <div className="neo-card-white" style={{ padding: '1.75rem', display: 'inline-block', marginBottom: '1.5rem', background: '#ffffff', boxShadow: '4px 4px 0px 0px #000000' }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/lapor')}`}
              alt="QR Code Lapor SI-APARAT"
              style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
            />
            <p className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 900, marginTop: '10px', color: '#000000' }}>
              {window.location.origin}/lapor
            </p>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--neo-text-muted)', marginBottom: '1.5rem', fontWeight: 600 }}>
            Tempelkan QR Code ini di Mading Sekolah, Asrama, atau Kelas untuk memudahkan Taruna melapor secara 100% anonim.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => window.print()} className="neo-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Printer size={18} strokeWidth={2.5} />
              <span>Cetak Poster</span>
            </button>
            <button onClick={() => setShowQrModal(false)} className="neo-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
