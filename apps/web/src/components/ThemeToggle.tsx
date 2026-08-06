import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle Light / Dark Mode"
      title={`Aktifkan Mode ${isDark ? 'Terang' : 'Gelap'}`}
      style={{
        position: 'relative',
        width: '68px',
        height: '36px',
        borderRadius: '20px',
        background: 'var(--neo-card-bg)',
        border: '3px solid #000000',
        boxShadow: '3px 3px 0px 0px #000000',
        cursor: 'pointer',
        padding: '2px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Sun Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          zIndex: 2,
          color: isDark ? '#6b7280' : '#d97706',
          transition: 'color 0.2s ease',
        }}
      >
        <Sun size={17} strokeWidth={2.5} />
      </span>

      {/* Moon Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          zIndex: 2,
          color: isDark ? '#a855f7' : '#9ca3af',
          transition: 'color 0.2s ease',
        }}
      >
        <Moon size={17} strokeWidth={2.5} />
      </span>

      {/* Sliding Thumb Knob */}
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: isDark ? '33px' : '3px',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: '#ffe600',
          border: '2px solid #000000',
          boxShadow: '1px 1px 0px 0px #000000',
          transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1,
        }}
      />
    </button>
  );
};
