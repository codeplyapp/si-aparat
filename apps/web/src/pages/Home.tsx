import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Search, ArrowRight, FileText, Clock, CheckCircle2 } from 'lucide-react';
import mpkLogo from '../assets/logo-mpk.png';
import { getPublicStats, type PublicStatsResponse } from '../lib/api';

export const Home: React.FC = () => {
  const [stats, setStats] = useState<PublicStatsResponse>({
    totalLaporan: 0,
    sedangDiproses: 0,
    sudahDitangani: 0,
  });

  useEffect(() => {
    getPublicStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '1.5rem 0.5rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            className="neo-card-yellow"
            style={{
              padding: '8px',
              borderRadius: '50%',
              width: '96px',
              height: '96px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '5px 5px 0px 0px #000000',
            }}
          >
            <img src={mpkLogo} alt="Logo MPK SMAN 2 Taruna Bhayangkara" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          </div>
        </div>

        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.1rem, 5.5vw, 3.6rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.25rem',
            color: 'var(--neo-text)',
          }}
        >
          SUARAKAN ASPIRASIMU <br />
          <span
            style={{
              background: '#ffe600',
              color: '#000000',
              padding: '2px 14px',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px 0px #000000',
              display: 'inline-block',
              marginTop: '6px',
              borderRadius: '8px',
            }}
          >
            TANPA RASA TAKUT! 🚀
          </span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--neo-text-muted)', maxWidth: '720px', margin: '0 auto 2rem', fontWeight: 600 }}>
          Platform resmi pelaporan Taruna-Taruni. Identitas Anda <strong style={{ color: '#000000', background: '#ffe600', padding: '0 5px', border: '1.5px solid #000000' }}>TIDAK AKAN PERNAH</strong> diketahui oleh siapapun.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/lapor" className="neo-btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            <Send size={18} strokeWidth={2.5} />
            <span>Kirim Aspirasi</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
          <Link to="/tracking" className="neo-btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
            <Search size={18} strokeWidth={2.5} />
            <span>Cek Status Laporan</span>
          </Link>
        </div>
      </section>

      {/* Live Statistics Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', margin: '1.5rem 0 3rem' }}>
        {/* Card 1: Total Laporan */}
        <div className="neo-card neo-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div
              style={{
                background: '#ffe600',
                color: '#000000',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px 0px #000000',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={28} strokeWidth={2.5} />
            </div>
            <span className="neo-badge neo-badge-yellow">TOTAL LAPORAN</span>
          </div>

          <div className="font-display" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--neo-text)', lineHeight: 1, margin: '0.75rem 0 0.25rem' }}>
            {stats.totalLaporan}
          </div>

          <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: 'var(--neo-text)' }}>
            Total Laporan Masuk
          </h3>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
            Jumlah seluruh aspirasi & laporan Taruna yang telah diterima oleh sistem.
          </p>
        </div>

        {/* Card 2: Sedang Diproses */}
        <div className="neo-card neo-card-hover-pink" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div
              style={{
                background: '#a855f7',
                color: '#ffffff',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px 0px #000000',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={28} strokeWidth={2.5} />
            </div>
            <span className="neo-badge neo-badge-purple">DALAM PROSES</span>
          </div>

          <div className="font-display" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--neo-text)', lineHeight: 1, margin: '0.75rem 0 0.25rem' }}>
            {stats.sedangDiproses}
          </div>

          <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: 'var(--neo-text)' }}>
            Laporan Sedang Diproses
          </h3>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
            Laporan yang sedang ditinjau dan ditindaklanjuti oleh tim MPK & Pengasuh.
          </p>
        </div>

        {/* Card 3: Sudah Ditangani */}
        <div className="neo-card neo-card-hover-mint" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div
              style={{
                background: '#00f0ff',
                color: '#000000',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px 0px #000000',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            <span className="neo-badge neo-badge-mint">SUDAH DITANGANI</span>
          </div>

          <div className="font-display" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--neo-text)', lineHeight: 1, margin: '0.75rem 0 0.25rem' }}>
            {stats.sudahDitangani}
          </div>

          <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: 'var(--neo-text)' }}>
            Laporan Sudah Ditangani
          </h3>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
            Aspirasi & laporan yang telah diselesaikan dan diberikan balasan resmi.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section
        className="neo-card"
        style={{
          padding: '2.25rem 1.5rem',
          margin: '2.5rem 0',
          boxShadow: '6px 6px 0px 0px #000000',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="neo-badge neo-badge-mint" style={{ marginBottom: '0.5rem' }}>CARA KERJA</span>
          <h2 className="font-display" style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '6px', color: 'var(--neo-text)' }}>
            Alur Pelaporan Taruna
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div className="neo-card" style={{ padding: '1.25rem', boxShadow: '4px 4px 0px 0px #ffe600' }}>
            <div
              className="font-display"
              style={{
                background: '#ffe600',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px 0px #000000',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
                marginBottom: '0.85rem',
              }}
            >
              1
            </div>
            <h4 className="font-display" style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--neo-text)' }}>
              Isi Form Aspirasi
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--neo-text-muted)', fontWeight: 500 }}>Pilih kategori, ketik detail laporan, dan upload foto bukti jika ada.</p>
          </div>

          <div className="neo-card" style={{ padding: '1.25rem', boxShadow: '4px 4px 0px 0px #00f0ff' }}>
            <div
              className="font-display"
              style={{
                background: '#00f0ff',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px 0px #000000',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
                marginBottom: '0.85rem',
              }}
            >
              2
            </div>
            <h4 className="font-display" style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--neo-text)' }}>
              Simpan Kode Tracking
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--neo-text-muted)', fontWeight: 500 }}>Dapatkan kode unik (misal: <code style={{ background: '#ffe600', color: '#000000', padding: '0 4px', border: '1px solid #000' }}>APR-20260806-X7K2</code>).</p>
          </div>

          <div className="neo-card" style={{ padding: '1.25rem', boxShadow: '4px 4px 0px 0px #a855f7' }}>
            <div
              className="font-display"
              style={{
                background: '#a855f7',
                color: '#ffffff',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px 0px #000000',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
                marginBottom: '0.85rem',
              }}
            >
              3
            </div>
            <h4 className="font-display" style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--neo-text)' }}>
              Verifikasi MPK
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--neo-text-muted)', fontWeight: 500 }}>MPK meninjau laporan, dekripsi pesan secara terisolasi, dan melakukan penanganan.</p>
          </div>

          <div className="neo-card" style={{ padding: '1.25rem', boxShadow: '4px 4px 0px 0px #ff3b5c' }}>
            <div
              className="font-display"
              style={{
                background: '#ff3b5c',
                color: '#ffffff',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px 0px #000000',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
                marginBottom: '0.85rem',
              }}
            >
              4
            </div>
            <h4 className="font-display" style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--neo-text)' }}>
              Cek Balasan Resmi
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--neo-text-muted)', fontWeight: 500 }}>Gunakan Kode Tracking untuk membaca balasan dan memantau status penyelesaian.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
