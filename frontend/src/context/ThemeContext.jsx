import React, { useEffect, useMemo, useState } from 'react';
import ThemeContext from './themeContext.js';
import { readTheme, persistTheme } from './themePreference.js';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try { return readTheme(window.localStorage); } catch { return 'light'; }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'dark' ? '#19172f' : '#f1edf7');
    try { persistTheme(window.localStorage, theme); } catch { /* Storage may be unavailable. */ }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
