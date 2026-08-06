import React from 'react';
import { Shield, EyeOff, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: '4rem',
        padding: '2.5rem 1rem',
        background: 'var(--neo-footer-bg)',
        borderTop: '3px solid #000000',
        color: 'var(--neo-text)',
        fontSize: '0.875rem',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="neo-badge neo-badge-yellow">
            <EyeOff size={16} strokeWidth={2.5} />
            <span>100% Aman</span>
          </div>
          <div className="neo-badge neo-badge-mint">
            <Lock size={16} strokeWidth={2.5} />
            <span>Enkripsi Militer AES-256</span>
          </div>
          <div className="neo-badge neo-badge-pink">
            <Shield size={16} strokeWidth={2.5} />
            <span>Aksi Cepat MPK 2×24 Jam</span>
          </div>
        </div>

        <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.825rem', fontWeight: 600 }}>
          © {new Date().getFullYear()} <strong style={{ color: 'var(--neo-text)' }}>SI-APARAT</strong> — Sistem Informasi & Aspirasi Taruna. SMAN 2 TARUNA BHAYANGKARA JAWA TIMUR.
        </p>
      </div>
    </footer>
  );
};
