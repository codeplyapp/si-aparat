import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Send, Search, EyeOff, Lock, ArrowRight } from 'lucide-react';
import mpkLogo from '../assets/logo-mpk.png';

export const Home: React.FC = () => {
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

      {/* Feature Cards Grid (Theme-Aware Cards) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', margin: '1.5rem 0 3rem' }}>
        {/* Card 1: Perundungan Alert */}
        <div className="neo-card neo-card-hover-pink" style={{ padding: '1.75rem' }}>
          <div
            style={{
              background: '#ff3b5c',
              color: '#ffffff',
              border: '3px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <ShieldAlert size={28} strokeWidth={2.5} />
          </div>
          <span className="neo-badge neo-badge-pink" style={{ marginBottom: '0.75rem' }}>PRIORITAS UTAMA</span>
          <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--neo-text)' }}>
            Penanganan Bullying 1×24 Jam
          </h3>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.925rem', fontWeight: 500 }}>
            Setiap laporan kategori perundungan akan langsung ditandai <strong style={{ color: '#ff3b5c' }}>Alert Merah</strong> dan wajib diproses MPK dalam 24 jam.
          </p>
        </div>

        {/* Card 2: Zero IP Logging */}
        <div className="neo-card neo-card-hover" style={{ padding: '1.75rem' }}>
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
              marginBottom: '1rem',
            }}
          >
            <EyeOff size={28} strokeWidth={2.5} />
          </div>
          <span className="neo-badge neo-badge-yellow" style={{ marginBottom: '0.75rem' }}>PRIVASI TOTAL</span>
          <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--neo-text)' }}>
            Zero IP & Headers Logging
          </h3>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.925rem', fontWeight: 500 }}>
            Sistem secara otomatis membuang IP Address, User-Agent, dan lokasi Anda pada level middleware API. Tidak ada jejak digital!
          </p>
        </div>

        {/* Card 3: Enkripsi AES-256 */}
        <div className="neo-card neo-card-hover-mint" style={{ padding: '1.75rem' }}>
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
              marginBottom: '1rem',
            }}
          >
            <Lock size={28} strokeWidth={2.5} />
          </div>
          <span className="neo-badge neo-badge-mint" style={{ marginBottom: '0.75rem' }}>KEAMANAN DATA</span>
          <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--neo-text)' }}>
            Enkripsi AES-256-GCM
          </h3>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.925rem', fontWeight: 500 }}>
            Isi laporan & foto bukti dienkripsi di level server sebelum masuk ke database & Storage. Hanya petugas berwenang yang dapat dekripsi.
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
