import React from 'react';
import { useTheme } from '../context/useTheme.js';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-pressed={isDark}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      <span className="theme-sky" aria-hidden="true">
        <span className="theme-stars">✦ · ✧</span>
        <span className="theme-clouds" />
        <span className="theme-orb"><span /><span /><span /></span>
      </span>
    </button>
  );
}
