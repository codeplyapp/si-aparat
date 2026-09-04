import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import {
  STATUS_LABELS,
  KATEGORI_LABELS,
  KategoriLaporan,
  StatusLaporan,
} from '@si-aparat/shared';
import {
  getLaporanListPembina,
  getLaporanDetailPembina,
  addCatatanPembina,
  type LaporanItemMPK,
  type LaporanDetailPembina,
  ApiError,
} from '../lib/api';
import {
  Eye,
  LogOut,
  RefreshCw,
  MessageSquarePlus,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';

export const DashboardPembina: React.FC = () => {
  const navigate = useNavigate();
  const [laporanList, setLaporanList] = useState<LaporanItemMPK[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Detail Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LaporanDetailPembina | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Catatan Form
  const [catatanText, setCatatanText] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getLaporanListPembina();
      setLaporanList(res.data);
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg('Gagal memuat daftar eskalasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getLaporanDetailPembina(id);
      setDetail(data);
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !catatanText.trim()) return;

    setActionLoading(true);
    try {
      await addCatatanPembina(selectedId, catatanText.trim());
      setCatatanText('');
      await openDetail(selectedId);
      alert('Catatan tindak lanjut berhasil disimpan.');
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setActionLoading(false);
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

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neo-text)' }}>Dashboard Pengasuh</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchList} className="neo-btn-secondary" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <RefreshCw size={18} strokeWidth={2.5} />
            <span>Refresh</span>
          </button>
          <button onClick={handleLogout} className="neo-btn-danger" style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
            <LogOut size={18} strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="neo-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', background: 'var(--neo-card-bg)', boxShadow: '5px 5px 0px 0px #a855f7', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShieldCheck size={28} strokeWidth={2.5} color="#a855f7" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.925rem', color: 'var(--neo-text)', fontWeight: 600 }}>
          Dashboard Pengasuh memuat khusus kasus yang telah diverifikasi & di-eskalasi oleh MPK. Identitas pelapor tidak pernah tersimpan di sistem demi keamanan.
        </p>
      </div>

      {/* Table Data Eskalasi */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
          Memuat data eskalasi...
        </div>
      ) : errorMsg ? (
        <div className="neo-card-pink" style={{ padding: '1.5rem', textAlign: 'center', fontWeight: 800 }}>{errorMsg}</div>
      ) : laporanList.length === 0 ? (
        <div className="neo-card font-display" style={{ padding: '3rem', textAlign: 'center', color: 'var(--neo-text-muted)', background: 'var(--neo-card-bg)', fontWeight: 700 }}>
          Belum ada laporan yang diteruskan oleh MPK saat ini.
        </div>
      ) : (
        <div className="neo-card" style={{ overflowX: 'auto', background: 'var(--neo-card-bg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem', color: 'var(--neo-text)' }}>
            <thead>
              <tr style={{ borderBottom: '3px solid #000000', background: 'var(--neo-bg)' }}>
                <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Kode Tracking</th>
                <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Kategori</th>
                <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Tanggal Eskalasi</th>
                <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Status</th>
                <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Foto</th>
                <th className="font-display" style={{ padding: '16px 18px', textAlign: 'right', fontWeight: 800 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {laporanList.map((item) => {
                const isBully = item.kategori === KategoriLaporan.PERUNDUNGAN;
                return (
                  <tr key={item.id} style={{ borderBottom: '2px solid rgba(150, 150, 150, 0.2)' }}>
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
                      {new Date(item.updatedAt).toLocaleDateString('id-ID')}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      {getStatusBadge(item.status)}
                    </td>
                    <td style={{ padding: '16px 18px', color: 'var(--neo-text-muted)' }}>
                      {item._count && item._count.lampiran > 0 ? (
                        <span className="neo-badge neo-badge-mint" style={{ fontSize: '0.75rem' }}>
                          <ImageIcon size={14} strokeWidth={2.5} /> {item._count.lampiran} foto
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <button onClick={() => openDetail(item.id)} className="neo-btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        <Eye size={16} strokeWidth={2.5} />
                        <span>Lihat & Catat</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail & Add Catatan */}
      <Modal
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={detail?.kodeTracking || 'Detail Kasus Laporan'}
        subtitle={
          detail ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--neo-text-muted)', marginTop: '2px', fontWeight: 600 }}>
              Kategori: <strong style={{ color: 'var(--neo-text)' }}>{KATEGORI_LABELS[detail.kategori]}</strong>
            </p>
          ) : undefined
        }
        shadowColor="#a855f7"
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
            🔓 Mendekripsi konten...
          </div>
        ) : detail ? (
          <div>
            {/* Content Box */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                Detail Kasus Laporan
              </h4>
              <div
                className="neo-card-white"
                style={{
                  padding: '1.5rem',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontWeight: 600,
                  boxShadow: '5px 5px 0px 0px #a855f7',
                  background: 'var(--neo-bg)',
                }}
              >
                {detail.konten}
              </div>
            </div>

            {/* Foto Lampiran Bukti */}
            {detail.lampiran && detail.lampiran.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                  Foto Bukti Lampiran ({detail.lampiran.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {detail.lampiran.map((foto, idx) => (
                    <div key={idx} className="neo-card" style={{ padding: '10px', background: 'var(--neo-bg)', textAlign: 'center', boxShadow: '3px 3px 0px 0px #a855f7' }}>
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
                        className="neo-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                      >
                        <ImageIcon size={14} strokeWidth={2.5} color="var(--neo-text)" />
                        <span>Buka Foto {idx + 1} ({Math.round(foto.fileSizeBytes / 1024)} KB)</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Catatan Tindak Lanjut */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                Log Tindak Lanjut Pengasuh
              </h4>
              {detail.catatan.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--neo-text-muted)', fontStyle: 'italic', fontWeight: 600 }}>
                  Belum ada catatan tindak lanjut yang ditulis.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {detail.catatan.map((c) => (
                    <div key={c.id} className="neo-card" style={{ padding: '14px 18px', background: 'var(--neo-bg)', boxShadow: '3px 3px 0px 0px #000000' }}>
                      <p style={{ color: 'var(--neo-text)', marginBottom: '6px', fontWeight: 600, fontSize: '0.95rem' }}>{c.catatan}</p>
                      <p className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--neo-text-muted)' }}>
                        Oleh: <strong style={{ color: 'var(--neo-text)' }}>{c.author.namaLengkap}</strong> ({new Date(c.createdAt).toLocaleString('id-ID')})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Catatan Form */}
            <form onSubmit={handleAddCatatan} style={{ borderTop: '3px solid #000000', paddingTop: '1.75rem' }}>
              <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--neo-text)' }}>
                Tambah Catatan Tindak Lanjut Lapangan
              </h4>
              <textarea
                rows={4}
                value={catatanText}
                onChange={(e) => setCatatanText(e.target.value)}
                placeholder="Contoh: Sudah diklarifikasi bersama Wali Kelas dan Pengasuh Asrama..."
                className="neo-input"
                style={{ marginBottom: '12px', minHeight: '100px' }}
              />
              <button type="submit" disabled={actionLoading} className="neo-btn-primary" style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
                <MessageSquarePlus size={18} strokeWidth={2.5} />
                <span>{actionLoading ? 'Menyimpan...' : 'Simpan Catatan'}</span>
              </button>
            </form>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
