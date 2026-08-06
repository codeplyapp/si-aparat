import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, ApiError } from '../lib/api';
import { User, Key, AlertTriangle, ShieldCheck } from 'lucide-react';
import mpkLogo from '../assets/logo-mpk.png';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginUser(username, password);
      // Simpan session
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res));

      // Redirect sesuai role
      if (res.role === 'SUPER_ADMIN') navigate('/dashboard/admin');
      else if (res.role === 'PEMBINA') navigate('/dashboard/pembina');
      else navigate('/dashboard/mpk');
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

  return (
    <div style={{ maxWidth: '440px', margin: '2rem auto 0', padding: '0 1rem' }} className="animate-neo-pop">
      <div className="neo-card" style={{ padding: '2.5rem', background: 'var(--neo-card-bg)', boxShadow: '6px 6px 0px 0px #ffe600' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              background: '#ffe600',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px 0px #000000',
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              padding: '6px',
            }}
          >
            <img src={mpkLogo} alt="MPK Logo" style={{ width: '54px', height: '54px', objectFit: 'contain' }} />
          </div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--neo-text)', marginTop: '4px' }}>
            Portal Petugas
          </h1>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
            Khusus MPK, Pengasuh, & Administrator
          </p>
        </div>

        {errorMsg && (
          <div
            className="neo-card-pink"
            style={{
              padding: '12px 14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={20} strokeWidth={2.5} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--neo-text)' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} strokeWidth={2.5} color="var(--neo-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="neo-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="font-display" style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--neo-text)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={18} strokeWidth={2.5} color="var(--neo-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="neo-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem' }}
          >
            <ShieldCheck size={20} strokeWidth={2.5} />
            <span>{loading ? 'Authenticating...' : 'Login ke Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
