import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import {
  KategoriLaporan,
  KATEGORI_LABELS,
  KONTEN_MIN_LENGTH,
  KONTEN_MAX_LENGTH,
  MAX_FOTO_COUNT,
  MAX_FOTO_SIZE_MB,
} from '@si-aparat/shared';
import { submitAspirasi, ApiError } from '../lib/api';
import { AlertTriangle, Send, Upload, X, CheckCircle, Copy, Check, FileText, ShieldAlert } from 'lucide-react';

export const Lapor: React.FC = () => {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState<KategoriLaporan>(KategoriLaporan.SARANA);
  const [konten, setKonten] = useState<string>('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // Anti-Spam & Bot Protection States
  const [honeypot, setHoneypot] = useState<string>('');
  const [formMountedAt, setFormMountedAt] = useState<number>(() => Date.now());

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Sukses
  const [successKode, setSuccessKode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const isPerundungan = kategori === KategoriLaporan.PERUNDUNGAN;

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    if (fotos.length + selectedFiles.length > MAX_FOTO_COUNT) {
      setErrorMsg(`Maksimal ${MAX_FOTO_COUNT} foto lampiran yang diizinkan.`);
      return;
    }

    const invalidSize = selectedFiles.find((f) => f.size > MAX_FOTO_SIZE_MB * 1024 * 1024);
    if (invalidSize) {
      setErrorMsg(`Ukuran foto '${invalidSize.name}' melebihi batas ${MAX_FOTO_SIZE_MB}MB.`);
      return;
    }

    setErrorMsg(null);
    setFotos((prev) => [...prev, ...selectedFiles]);
  };

  const removeFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setErrorMsg('Anda harus mencentang konfirmasi pemahaman laporan anonim.');
      return;
    }

    if (konten.length < KONTEN_MIN_LENGTH) {
      setErrorMsg(`Konten laporan minimal ${KONTEN_MIN_LENGTH} karakter.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await submitAspirasi(kategori, konten, fotos, {
        honeypot,
        formTimestamp: formMountedAt,
      });
      setSuccessKode(res.kodeTracking);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!successKode) return;
    navigator.clipboard.writeText(successKode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }} className="animate-neo-pop">
      <div className="neo-card" style={{ padding: '2.5rem', background: 'var(--neo-card-bg)' }}>
        <div style={{ marginBottom: '2rem', borderBottom: '3px solid #000000', paddingBottom: '1.5rem' }}>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neo-text)' }}>
            Form Aspirasi & Laporan
          </h1>
          <p style={{ color: 'var(--neo-text-muted)', fontSize: '0.95rem', fontWeight: 600, marginTop: '4px' }}>
            Suarakan keluhan atau aspirasi Anda tanpa rasa khawatir. Identitas Anda tidak akan tersimpan.
          </p>
        </div>

        {errorMsg && (
          <div
            className="neo-card-pink"
            style={{
              padding: '14px 18px',
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertTriangle size={22} strokeWidth={2.5} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Anti-Bot Honeypot Field (Invisible to human users) */}
          <div
            style={{
              position: 'absolute',
              opacity: 0,
              top: 0,
              left: '-9999px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Kategori Selection */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label className="font-display" style={{ display: 'block', fontWeight: 800, marginBottom: '0.75rem', fontSize: '1.05rem', color: 'var(--neo-text)' }}>
              1. Pilih Kategori Laporan <span style={{ color: 'var(--neo-pink)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
              {(Object.keys(KategoriLaporan) as Array<keyof typeof KategoriLaporan>).map((key) => {
                const val = KategoriLaporan[key];
                const isSelected = kategori === val;
                const isBully = val === KategoriLaporan.PERUNDUNGAN;

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setKategori(val)}
                    className="font-display"
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: '3px solid #000000',
                      boxShadow: isSelected ? '4px 4px 0px 0px #000000' : '2px 2px 0px 0px #000000',
                      background: isSelected
                        ? isBully
                          ? 'var(--neo-pink)'
                          : 'var(--neo-yellow)'
                        : 'var(--neo-card-bg)',
                      color: isSelected ? (isBully ? '#ffffff' : '#000000') : 'var(--neo-card-text)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transform: isSelected ? 'translate(-2px, -2px)' : 'none',
                    }}
                  >
                    {isBully && <AlertTriangle size={18} strokeWidth={2.5} />}
                    <span>{KATEGORI_LABELS[val]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Red Alert Banner for Bullying */}
          {isPerundungan && (
            <div
              className="neo-card-pink animate-neo-pop"
              style={{
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                boxShadow: '5px 5px 0px 0px #000000',
              }}
            >
              <ShieldAlert size={28} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 className="font-display" style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.05rem', marginBottom: '4px' }}>
                  PRIORITAS TINGGI — PERUNDUNGAN / BULLYING
                </h4>
                <p style={{ color: '#ffffff', fontSize: '0.9rem', lineHeight: 1.45, fontWeight: 600 }}>
                  Laporan kategori ini langsung memicu alert merah ke seluruh MPK & Pengasuh. Penanganan dijamin secara rahasia dalam 1×24 jam.
                </p>
              </div>
            </div>
          )}

          {/* Textarea Konten Laporan */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="font-display" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neo-text)' }}>
                2. Detail Laporan <span style={{ color: 'var(--neo-pink)' }}>*</span>
              </label>
              <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: konten.length < KONTEN_MIN_LENGTH ? 'var(--neo-pink)' : '#059669' }}>
                {konten.length} / {KONTEN_MAX_LENGTH} karakter (min {KONTEN_MIN_LENGTH})
              </span>
            </div>
            <textarea
              rows={6}
              value={konten}
              onChange={(e) => setKonten(e.target.value)}
              placeholder="Tuliskan kronologi kejadian, lokasi, sarana yang rusak, atau aspirasi Anda secara jelas..."
              className="neo-input"
              style={{
                minHeight: '140px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Upload Foto Bukti */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="font-display" style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--neo-text)' }}>
              3. Lampiran Foto Bukti (Opsional, max {MAX_FOTO_COUNT} foto {MAX_FOTO_SIZE_MB}MB)
            </label>

            <div
              style={{
                border: '3px dashed #000000',
                borderRadius: '12px',
                padding: '1.75rem',
                textAlign: 'center',
                background: 'var(--neo-bg)',
                boxShadow: '4px 4px 0px 0px #ffe600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => document.getElementById('foto-input')?.click()}
            >
              <Upload size={32} strokeWidth={2.5} color="var(--neo-text)" style={{ marginBottom: '8px' }} />
              <p className="font-display" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--neo-text)' }}>Klik atau Drag & Drop foto di sini</p>
              <p style={{ fontSize: '0.825rem', color: 'var(--neo-text-muted)', marginTop: '4px', fontWeight: 600 }}>
                Format: JPEG, PNG, WebP. Metadata EXIF/GPS foto otomatis dihapus demi menjaga anonimitas.
              </p>
              <input
                id="foto-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* List Foto Terpilih */}
            {fotos.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                {fotos.map((foto, idx) => (
                  <div
                    key={idx}
                    className="neo-card-white"
                    style={{
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      boxShadow: '3px 3px 0px 0px #000000',
                    }}
                  >
                    <FileText size={16} strokeWidth={2.5} color="#000000" />
                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                      {foto.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFoto(idx)}
                      style={{ background: 'none', border: 'none', color: '#ff3b5c', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkbox Agreement */}
          <div
            className="neo-card"
            style={{
              marginBottom: '2rem',
              background: 'var(--neo-bg)',
              padding: '14px 18px',
              boxShadow: '4px 4px 0px 0px #000000',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--neo-text)' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#ffe600', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600 }}>
                Saya memahami bahwa laporan ini dikirim secara <strong style={{ background: '#ffe600', padding: '0 4px', border: '1px solid #000' }}>100% anonim</strong>. Saya wajib menyimpan Kode Tracking secara mandiri untuk mengecek status balasan MPK.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="neo-btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '16px',
              fontSize: '1.1rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Send size={20} strokeWidth={2.5} />
            <span>{loading ? 'Mengenkripsi & Mengirim...' : 'Kirim Aspirasi'}</span>
          </button>
        </form>
      </div>

      {/* Modal Sukses setelah Submit */}
      <Modal
        isOpen={Boolean(successKode)}
        onClose={() => setSuccessKode(null)}
        maxWidth="520px"
        shadowColor="#ffe600"
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              background: '#000000',
              color: '#ffe600',
              border: '3px solid #000000',
              boxShadow: '3px 3px 0px 0px var(--neo-yellow)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle size={38} strokeWidth={2.5} />
          </div>

          <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--neo-text)' }}>
            Laporan Berhasil Terkirim! 🎉
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--neo-text-muted)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Isi laporan dienkripsi dengan AES-256. Simpan Kode Tracking ini untuk memantau status balasan MPK!
          </p>

          {/* Kode Tracking Display Box */}
          <div
            className="neo-card-white"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '4px 4px 0px 0px #000000',
            }}
          >
            <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.05em', color: 'var(--neo-text)' }}>
              {successKode}
            </span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="neo-btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              {copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
              <span>{copied ? 'Tersalin!' : 'Copy'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/tracking?kode=${successKode}`)}
              className="neo-btn-mint"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cek Status Sekarang
            </button>
            <button
              onClick={() => {
                setSuccessKode(null);
                setKonten('');
                setFotos([]);
                setConfirmed(false);
                setHoneypot('');
                setFormMountedAt(Date.now());
              }}
              className="neo-btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Kirim Lagi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
