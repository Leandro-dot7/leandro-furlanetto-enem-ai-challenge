import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/useTheme.js';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle fixed top-4 right-4 z-[60] flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-pressed={isDark}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
