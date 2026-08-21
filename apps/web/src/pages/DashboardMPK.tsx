import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StatusLaporan,
  STATUS_LABELS,
  KategoriLaporan,
  KATEGORI_LABELS,
  StatusMatriks,
  STATUS_MATRIKS_LABELS,
  SKOR_DAMPAK_LABELS,
  SKOR_KELAYAKAN_LABELS,
  hitungStatusMatriks,
} from '@si-aparat/shared';
import {
  getLaporanListMPK,
  getLaporanDetailMPK,
  updateStatusMPK,
  updateMatriksMPK,
  exportMatriksCSV,
  downloadBlob,
  eskalasiMPK,
  sendBalasanMPK,
  type LaporanItemMPK,
  type LaporanDetailMPK,
  ApiError,
} from '../lib/api';
import {
  ShieldAlert,
  Filter,
  Eye,
  Send,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const DashboardMPK: React.FC = () => {
  const navigate = useNavigate();
  const [laporanList, setLaporanList] = useState<LaporanItemMPK[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [filterStatusMatriks, setFilterStatusMatriks] = useState<string>('');

  // Selected Detail Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LaporanDetailMPK | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Matriks Form State
  const [skorDampak, setSkorDampak] = useState<number | null>(null);
  const [skorKelayakan, setSkorKelayakan] = useState<number | null>(null);
  const [isMelanggarAturan, setIsMelanggarAturan] = useState<boolean>(false);
  const [catatanTindakLanjut, setCatatanTindakLanjut] = useState<string>('');
  const [matriksLoading, setMatriksLoading] = useState<boolean>(false);

  // Balasan Form
  const [pesanBalasan, setPesanBalasan] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getLaporanListMPK({
        status: filterStatus || undefined,
        kategori: filterKategori || undefined,
        statusMatriks: filterStatusMatriks || undefined,
      });
      setLaporanList(res.data);
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message);
      else setErrorMsg('Gagal memuat daftar laporan');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterKategori, filterStatusMatriks]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getLaporanDetailMPK(id);
      setDetail(data);
      setSkorDampak(data.skorDampak !== null && data.skorDampak !== undefined ? data.skorDampak : null);
      setSkorKelayakan(data.skorKelayakan !== null && data.skorKelayakan !== undefined ? data.skorKelayakan : null);
      setIsMelanggarAturan(Boolean(data.isMelanggarAturan));
      setCatatanTindakLanjut(data.catatanTindakLanjut || '');

      if (data.balasan) setPesanBalasan(data.balasan.pesan);
      else setPesanBalasan('');
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: StatusLaporan) => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await updateStatusMPK(selectedId, newStatus);
      await openDetail(selectedId);
      await fetchList();
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMatriks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setMatriksLoading(true);
    try {
      await updateMatriksMPK(selectedId, {
        skorDampak,
        skorKelayakan,
        isMelanggarAturan,
        catatanTindakLanjut: catatanTindakLanjut.trim() || null,
      });
      await openDetail(selectedId);
      await fetchList();
      alert('Penilaian matriks berhasil disimpan!');
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
      else alert('Gagal menyimpan penilaian matriks');
    } finally {
      setMatriksLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const blob = await exportMatriksCSV({
        status: filterStatus || undefined,
        kategori: filterKategori || undefined,
        statusMatriks: filterStatusMatriks || undefined,
      });
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `matriks-aspirasi-${timestamp}.csv`);
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
      else alert('Gagal mengekspor data CSV');
    } finally {
      setExportLoading(false);
    }
  };

  const handleEskalasi = async () => {
    if (!selectedId) return;
    if (!window.confirm('Teruskan laporan ini ke Pengasuh Pembina?')) return;

    setActionLoading(true);
    try {
      await eskalasiMPK(selectedId);
      await openDetail(selectedId);
      await fetchList();
      alert('Laporan berhasil diteruskan ke Pembina.');
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBalasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !pesanBalasan.trim()) return;

    setActionLoading(true);
    try {
      await sendBalasanMPK(selectedId, pesanBalasan.trim());
      await openDetail(selectedId);
      alert('Pesan balasan berhasil terkirim ke pelapor!');
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

  // Stats Counters
  const countBaru = laporanList.filter((l) => l.status === StatusLaporan.BARU).length;
  const countPerundungan = laporanList.filter((l) => l.kategori === KategoriLaporan.PERUNDUNGAN).length;

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
          style={{
            background: '#e2e8f0',
            color: '#475569',
            borderColor: '#64748b',
          }}
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

  // Live status matriks calculation for modal preview
  const liveStatusMatriks = detail
    ? hitungStatusMatriks({
        kategori: detail.kategori,
        isMelanggarAturan,
        skorDampak,
        skorKelayakan,
      })
    : null;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neo-text)' }}>Dashboard MPK</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="neo-btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <Download size={18} strokeWidth={2.5} />
            <span>{exportLoading ? 'Mengekspor...' : 'Export CSV'}</span>
          </button>
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

      {/* Summary Cards (Neo-Brutalist Light Metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="neo-card-yellow" style={{ padding: '1.5rem' }}>
          <p className="font-display" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#000000' }}>BELUM DITINJAU</p>
          <h2 className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '4px', color: '#000000' }}>{countBaru}</h2>
        </div>
        <div className="neo-card-pink" style={{ padding: '1.5rem', boxShadow: '5px 5px 0px 0px #000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
            <ShieldAlert size={20} strokeWidth={2.5} />
            <p className="font-display" style={{ fontSize: '0.9rem', fontWeight: 900 }}>LAPORAN PEMBULLYAN</p>
          </div>
          <h2 className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '4px', color: '#ffffff' }}>{countPerundungan}</h2>
        </div>
        <div className="neo-card-mint" style={{ padding: '1.5rem' }}>
          <p className="font-display" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#000000' }}>TOTAL LAPORAN MASUK</p>
          <h2 className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '4px', color: '#000000' }}>{laporanList.length}</h2>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="neo-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', background: 'var(--neo-card-bg)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neo-text)', fontSize: '0.95rem', fontWeight: 800 }} className="font-display">
          <Filter size={20} strokeWidth={2.5} color="var(--neo-text)" />
          <span>Filter Laporan:</span>
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
          ⏳ Memuat data laporan...
        </div>
      ) : errorMsg ? (
        <div className="neo-card-pink" style={{ padding: '1.5rem', textAlign: 'center', fontWeight: 800 }}>{errorMsg}</div>
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
                <th className="font-display" style={{ padding: '16px 18px', fontWeight: 800 }}>Foto</th>
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
                      {item._count.lampiran > 0 ? (
                        <span className="neo-badge neo-badge-mint" style={{ fontSize: '0.75rem' }}>
                          <ImageIcon size={14} strokeWidth={2.5} /> {item._count.lampiran} foto
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => openDetail(item.id)}
                        className="neo-btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      >
                        <Eye size={16} strokeWidth={2.5} />
                        <span>Buka Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail Laporan (Neo-Brutalist Dialog) */}
      {selectedId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="neo-card animate-neo-pop" style={{ maxWidth: '820px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', background: 'var(--neo-card-bg)', boxShadow: '8px 8px 0px 0px #ffe600' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', borderBottom: '3px solid #000000', paddingBottom: '1.25rem', gap: '1rem' }}>
              <div>
                <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--neo-text)' }}>
                  {detail?.kodeTracking}
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--neo-text-muted)', marginTop: '2px', fontWeight: 600 }}>
                  Kategori: <strong style={{ color: 'var(--neo-text)' }}>{detail ? KATEGORI_LABELS[detail.kategori] : ''}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} className="neo-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Tutup
              </button>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neo-text-muted)', fontWeight: 700 }} className="font-display">
                🔓 Mendekripsi konten...
              </div>
            ) : detail ? (
              <div>
                {/* Status Bar & Action Buttons */}
                <div className="neo-card" style={{ background: '#faf8f5', padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="font-display" style={{ fontSize: '0.85rem', color: '#0d0e12', display: 'block', marginBottom: '6px', fontWeight: 800 }}>
                      UBAH STATUS LAPORAN:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(Object.keys(StatusLaporan) as Array<keyof typeof StatusLaporan>).map((st) => (
                        <button
                          key={st}
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(StatusLaporan[st])}
                          className="font-display"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '2px solid #000000',
                            background: detail.status === StatusLaporan[st] ? '#ffe600' : '#ffffff',
                            color: '#000000',
                            fontSize: '0.825rem',
                            cursor: 'pointer',
                            fontWeight: 800,
                            boxShadow: detail.status === StatusLaporan[st] ? '3px 3px 0px 0px #000000' : 'none',
                          }}
                        >
                          {STATUS_LABELS[StatusLaporan[st]]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!detail.isEskalasi && (
                    <button onClick={handleEskalasi} disabled={actionLoading} className="neo-btn-mint" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                      <span>Eskalasi ke Pengasuh</span>
                    </button>
                  )}
                </div>

                {/* Decrypted Content Box */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                    Isi Laporan
                  </h4>
                  <div
                    className="neo-card-white"
                    style={{
                      padding: '1.5rem',
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      fontWeight: 600,
                      boxShadow: '5px 5px 0px 0px #ffe600',
                      background: 'var(--neo-bg)',
                    }}
                  >
                    {detail.konten}
                  </div>
                </div>

                {/* Foto Lampiran */}
                {detail.lampiran.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h4 className="font-display" style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                      Foto Bukti (Presigned URL 15 Menit)
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {detail.lampiran.map((foto, idx) => (
                        <a key={idx} href={foto.downloadUrl} target="_blank" rel="noreferrer" className="neo-btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                          <ImageIcon size={18} strokeWidth={2.5} color="var(--neo-text)" />
                          <span>Lihat Foto {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seksi Penilaian Matriks Tabulasi (Rapat Pleno MPK) */}
                <div
                  className="neo-card"
                  style={{
                    background: 'var(--neo-card-bg)',
                    border: '3px solid #000000',
                    padding: '1.5rem',
                    marginBottom: '1.75rem',
                    boxShadow: '6px 6px 0px 0px #00f0ff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={20} strokeWidth={2.5} color="var(--neo-text)" />
                      <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--neo-text)' }}>
                        PENILAIAN MATRIKS TABULASI (RAPAT PLENO)
                      </h4>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--neo-text-muted)', marginRight: '6px' }}>
                        Preview Status:
                      </span>
                      {getMatriksBadge(liveStatusMatriks)}
                    </div>
                  </div>

                  {/* Kategori Note Alert */}
                  {detail.kategori === KategoriLaporan.PERUNDUNGAN && (
                    <div className="neo-card-pink" style={{ padding: '10px 14px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      ⚠️ <strong>Kategori Perundungan:</strong> Otomatis masuk status 🟢 <strong>Prioritas Utama</strong> untuk eskalasi segera (SLA 1x24 jam).
                    </div>
                  )}
                  {detail.kategori === KategoriLaporan.KEGIATAN && (
                    <div className="neo-card-mint" style={{ padding: '10px 14px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, color: '#000000' }}>
                      ℹ️ <strong>Kategori Kegiatan:</strong> Otomatis masuk status 🔵 <strong>Delegasi OSIS</strong> untuk ditindaklanjuti pengurus harian.
                    </div>
                  )}

                  <form onSubmit={handleSaveMatriks}>
                    {/* Checkbox Melanggar Aturan */}
                    <div style={{ marginBottom: '1.25rem', padding: '10px 14px', background: 'var(--neo-bg)', border: '2px solid #000000', borderRadius: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', color: 'var(--neo-text)' }} className="font-display">
                        <input
                          type="checkbox"
                          checked={isMelanggarAturan}
                          onChange={(e) => setIsMelanggarAturan(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#ff3b5c', cursor: 'pointer' }}
                        />
                        <span>Laporan Melanggar Tata Tertib / Aturan Sekolah (Otomatis Dialihkan ke 🔴 ARSIP)</span>
                      </label>
                    </div>

                    {/* Skor Dampak & Kelayakan */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.875rem', marginBottom: '6px', color: 'var(--neo-text)' }}>
                          1. Skor Dampak (1 - 4):
                        </label>
                        <select
                          value={skorDampak !== null ? skorDampak : ''}
                          onChange={(e) => setSkorDampak(e.target.value ? Number(e.target.value) : null)}
                          className="neo-input"
                          style={{ fontSize: '0.875rem', padding: '10px 12px' }}
                        >
                          <option value="">-- Pilih Skor Dampak --</option>
                          {[1, 2, 3, 4].map((s) => (
                            <option key={s} value={s}>{SKOR_DAMPAK_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.875rem', marginBottom: '6px', color: 'var(--neo-text)' }}>
                          2. Skor Kelayakan (1 - 4):
                        </label>
                        <select
                          value={skorKelayakan !== null ? skorKelayakan : ''}
                          onChange={(e) => setSkorKelayakan(e.target.value ? Number(e.target.value) : null)}
                          className="neo-input"
                          style={{ fontSize: '0.875rem', padding: '10px 12px' }}
                        >
                          <option value="">-- Pilih Skor Kelayakan --</option>
                          {[1, 2, 3, 4].map((s) => (
                            <option key={s} value={s}>{SKOR_KELAYAKAN_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Catatan & Tindak Lanjut */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.875rem', marginBottom: '6px', color: 'var(--neo-text)' }}>
                        Catatan & Rencana Tindak Lanjut Pleno:
                      </label>
                      <textarea
                        rows={3}
                        value={catatanTindakLanjut}
                        onChange={(e) => setCatatanTindakLanjut(e.target.value)}
                        placeholder="Contoh: Diajukan pada rapat komisi Sarpras minggu ke-3 / Diteruskan ke Seksi 4 OSIS..."
                        className="neo-input"
                        style={{ minHeight: '80px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={matriksLoading}
                        className="neo-btn-mint"
                        style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                      >
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                        <span>{matriksLoading ? 'Menyimpan...' : 'Simpan Penilaian Matriks'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Balasan MPK Form */}
                <form onSubmit={handleSendBalasan} style={{ marginTop: '2rem', borderTop: '3px solid #000000', paddingTop: '1.75rem' }}>
                  <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--neo-text)' }}>
                    Tanggapan MPK ke Pelapor
                  </h4>
                  <textarea
                    rows={4}
                    value={pesanBalasan}
                    onChange={(e) => setPesanBalasan(e.target.value)}
                    placeholder="Tuliskan pesan tanggapan atau informasi tindak lanjut..."
                    className="neo-input"
                    style={{ marginBottom: '12px', minHeight: '100px' }}
                  />
                  <button type="submit" disabled={actionLoading} className="neo-btn-primary" style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
                    <Send size={18} strokeWidth={2.5} />
                    <span>{actionLoading ? 'Mengirim...' : 'Kirim Balasan'}</span>
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

