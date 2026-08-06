import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleUser } from '@si-aparat/shared';
import { getUserListAdmin, createUserAdmin, deleteUserAdmin, type UserItemAdmin, ApiError } from '../lib/api';

const ROLE_LABELS: Record<RoleUser, string> = {
  [RoleUser.SUPER_ADMIN]: 'Super Admin',
  [RoleUser.MPK]: 'MPK',
  [RoleUser.PEMBINA]: 'Pengasuh Pembina',
};
import { UserPlus, Trash2, QrCode, LogOut, RefreshCw, AlertTriangle, Printer } from 'lucide-react';
import mpkLogo from '../assets/logo-mpk.png';

export const DashboardAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItemAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getUserListAdmin();
      setUsers(res.data);
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neo-text)' }}>Panel Super Admin</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowQrModal(true)} className="neo-btn-mint" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <QrCode size={18} strokeWidth={2.5} />
            <span>Cetak QR Poster</span>
          </button>
          <button onClick={fetchUsers} className="neo-btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <RefreshCw size={18} strokeWidth={2.5} />
            <span>Refresh</span>
          </button>
          <button onClick={handleLogout} className="neo-btn-danger" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <LogOut size={18} strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Form Create User & User Table */}
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">Memuat user...</div>
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

      {/* Modal QR Code Poster (Printable Light Neo-Brutalist) */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="neo-card animate-neo-pop" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', background: '#ffffff', textAlign: 'center', boxShadow: '8px 8px 0px 0px #ffe600' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <img src={mpkLogo} alt="MPK Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            </div>

            <h2 className="font-display" style={{ fontSize: '1.65rem', fontWeight: 900, color: '#000000' }}>
              POSTER ASPIRASI TARUNA
            </h2>
            <p className="font-display" style={{ fontSize: '0.85rem', color: '#000000', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase' }}>
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
        </div>
      )}
    </div>
  );
};
