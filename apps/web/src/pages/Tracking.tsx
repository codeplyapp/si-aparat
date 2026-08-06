import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  StatusLaporan,
  STATUS_LABELS,
  KATEGORI_LABELS,
  type TrackingResponse,
} from '@si-aparat/shared';
import { getTrackingStatus, ApiError } from '../lib/api';
import { Search, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';

export const Tracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [kodeInput, setKodeInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResponse | null>(null);

  const initialKode = searchParams.get('kode');

  const fetchStatus = async (kodeToFetch: string) => {
    if (!kodeToFetch.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await getTrackingStatus(kodeToFetch);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Gagal terhubung ke server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialKode) {
      setKodeInput(initialKode);
      fetchStatus(initialKode);
    }
  }, [initialKode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeInput.trim()) return;
    setSearchParams({ kode: kodeInput.trim().toUpperCase() });
    fetchStatus(kodeInput.trim().toUpperCase());
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      <div className="neo-card" style={{ padding: '2.5rem', marginBottom: '2rem', background: 'var(--neo-card-bg)' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neo-text)', margin: '4px 0 6px' }}>
          Cek Status Laporan
        </h1>
        <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', fontWeight: 600 }}>
          Masukkan Kode Tracking Anda (format: <code style={{ background: '#ffe600', color: '#000000', padding: '0 4px', border: '1px solid #000' }}>APR-YYYYMMDD-XXXX</code>) untuk mengecek balasan MPK.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={kodeInput}
            onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
            placeholder="Contoh: APR-20260806-7X3K"
            className="neo-input font-mono"
            style={{
              flex: 1,
              minWidth: '240px',
              fontSize: '1.1rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          />
          <button type="submit" disabled={loading} className="neo-btn-primary" style={{ padding: '14px 28px' }}>
            <Search size={20} strokeWidth={2.5} />
            <span>{loading ? 'Mencari...' : 'Cek Status'}</span>
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="neo-card-pink animate-neo-pop" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <AlertCircle size={40} strokeWidth={2.5} style={{ margin: '0 auto 0.75rem' }} />
          <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 900, marginBottom: '0.25rem' }}>
            Laporan Tidak Ditemukan
          </h3>
          <p style={{ color: '#ffffff', fontSize: '0.95rem', fontWeight: 600 }}>{errorMsg}</p>
        </div>
      )}

      {result && (
        <div className="neo-card animate-neo-pop" style={{ padding: '2.5rem', background: 'var(--neo-card-bg)', boxShadow: '6px 6px 0px 0px #ffe600' }}>
          {/* Header Info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.25rem',
              borderBottom: '3px solid #000000',
              paddingBottom: '1.5rem',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <p className="font-display" style={{ fontSize: '0.8rem', color: 'var(--neo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                KODE TRACKING
              </p>
              <h2 className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--neo-text)', marginTop: '2px' }}>
                {result.kodeTracking}
              </h2>
            </div>
            <div>
              <p className="font-display" style={{ fontSize: '0.8rem', color: 'var(--neo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: '6px' }}>
                STATUS SAAT INI
              </p>
              {getStatusBadge(result.status)}
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <span className="neo-badge neo-badge-yellow" style={{ fontSize: '0.85rem' }}>
              Kategori: {KATEGORI_LABELS[result.kategori]}
            </span>
          </div>

          {/* Balasan MPK jika ada */}
          {result.balasan ? (
            <div
              className="neo-card-white"
              style={{
                padding: '1.5rem',
                marginBottom: '1.75rem',
                boxShadow: '4px 4px 0px 0px #00f0ff',
                background: 'var(--neo-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', color: 'var(--neo-text)' }}>
                <MessageSquare size={22} strokeWidth={2.5} color="var(--neo-text)" />
                <h4 className="font-display" style={{ fontWeight: 900, fontSize: '1.1rem' }}>Pesan Balasan Resmi MPK</h4>
              </div>
              <p style={{ color: 'var(--neo-text)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '0.75rem', fontWeight: 600 }}>
                "{result.balasan.pesan}"
              </p>
              <p className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--neo-text-muted)', textAlign: 'right', fontWeight: 700 }}>
                Dikirim: {new Date(result.balasan.timestamp).toLocaleString('id-ID')}
              </p>
            </div>
          ) : (
            <div
              className="neo-card"
              style={{
                background: 'var(--neo-bg)',
                padding: '1.25rem',
                textAlign: 'center',
                color: 'var(--neo-text-muted)',
                fontSize: '0.9rem',
                marginBottom: '1.75rem',
                fontWeight: 600,
              }}
            >
              ⏳ Belum ada pesan balasan tertulis dari MPK. Silakan cek kembali secara berkala.
            </div>
          )}

          {/* Info Kerahasiaan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#059669', fontSize: '0.85rem', fontWeight: 800 }}>
            <ShieldCheck size={18} strokeWidth={2.5} />
            <span>Konten utuh laporan dienkripsi AES-256 demi menjaga kerahasiaan pelapor.</span>
          </div>
        </div>
      )}
    </div>
  );
};
