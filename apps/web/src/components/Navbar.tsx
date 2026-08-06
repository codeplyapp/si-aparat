import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Send, Search, Lock, Menu, X } from 'lucide-react';
import mpkLogo from '../assets/logo-mpk.png';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      style={{
        background: 'var(--neo-nav-bg)',
        borderBottom: '3px solid #000000',
        boxShadow: '0px 4px 0px 0px #ffe600',
        marginBottom: '2rem',
        padding: '0.85rem 1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Brand Logo & Title */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--neo-text)' }}>
          <div
            style={{
              background: '#ffe600',
              border: '2.5px solid #000000',
              boxShadow: '3px 3px 0px 0px #000000',
              padding: '3px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              flexShrink: 0,
            }}
          >
            <img src={mpkLogo} alt="MPK Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--neo-text)', lineHeight: 1 }}>
                SI-APARAT
              </h1>
              <span className="neo-badge neo-badge-yellow" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>MPK</span>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--neo-text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>TRENGGANA SUMAPALA</p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle />

          <Link
            to="/lapor"
            className={isActive('/lapor') ? 'neo-btn-primary' : 'neo-btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            <Send size={16} strokeWidth={2.5} />
            <span>Kirim Aspirasi</span>
          </Link>
          <Link
            to="/tracking"
            className={isActive('/tracking') ? 'neo-btn-primary' : 'neo-btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            <Search size={16} strokeWidth={2.5} />
            <span>Cek Status</span>
          </Link>
          <Link
            to="/login"
            className="neo-btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            title="Portal Login Petugas MPK / Pengasuh / Admin"
          >
            <Lock size={16} strokeWidth={2.5} />
            <span>Portal Officer</span>
          </Link>
        </div>

        {/* Mobile Right Controls: Theme Toggle + Hamburger */}
        <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="neo-btn-secondary"
            style={{ padding: '8px 10px' }}
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-only animate-neo-pop"
          style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '2.5px solid #000000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Link
            to="/lapor"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/lapor') ? 'neo-btn-primary' : 'neo-btn-secondary'}
            style={{ justifyContent: 'center', padding: '12px' }}
          >
            <Send size={18} strokeWidth={2.5} />
            <span>Kirim Aspirasi</span>
          </Link>
          <Link
            to="/tracking"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/tracking') ? 'neo-btn-primary' : 'neo-btn-secondary'}
            style={{ justifyContent: 'center', padding: '12px' }}
          >
            <Search size={18} strokeWidth={2.5} />
            <span>Cek Status Laporan</span>
          </Link>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="neo-btn-secondary"
            style={{ justifyContent: 'center', padding: '12px' }}
          >
            <Lock size={18} strokeWidth={2.5} />
            <span>Portal Officer</span>
          </Link>
        </div>
      )}
    </nav>
  );
};
