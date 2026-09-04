import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  shadowColor?: string;
  headerBg?: string;
  closeBtnText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '820px',
  shadowColor = '#ffe600',
  headerBg,
  closeBtnText = 'Tutup',
}) => {
  // Lock body scroll and register Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="neo-card animate-neo-pop"
        style={{
          maxWidth,
          width: '100%',
          maxHeight: 'min(90vh, 880px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--neo-card-bg)',
          border: '3px solid #000000',
          boxShadow: `8px 8px 0px 0px ${shadowColor}`,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Fixed Header */}
        {(title || subtitle) && (
          <div
            style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '3px solid #000000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              background: headerBg || 'var(--neo-card-bg)',
              flexShrink: 0,
            }}
          >
            <div>
              {typeof title === 'string' ? (
                <span className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--neo-text)' }}>
                  {title}
                </span>
              ) : (
                title
              )}
              {subtitle && (
                <div style={{ marginTop: '3px' }}>
                  {typeof subtitle === 'string' ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--neo-text-muted)', fontWeight: 600 }}>
                      {subtitle}
                    </p>
                  ) : (
                    subtitle
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="neo-btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <X size={16} strokeWidth={2.5} />
              <span>{closeBtnText}</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
