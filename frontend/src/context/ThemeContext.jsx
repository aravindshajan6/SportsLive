/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { KEYS, getItem, setItem } from '@/lib/storage.js';

const ThemeContext = createContext(null);

function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialTheme() {
  const saved = getItem(KEYS.theme);
  if (saved === 'light' || saved === 'dark') return saved;
  const fromDom = document.documentElement.dataset.theme;
  if (fromDom === 'light' || fromDom === 'dark') return fromDom;
  return systemTheme();
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0a1f' : '#f5f6fb');
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);
  const [hasExplicitChoice, setHasExplicitChoice] = useState(() => {
    const saved = getItem(KEYS.theme);
    return saved === 'light' || saved === 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow the OS preference until the user makes an explicit choice.
  useEffect(() => {
    if (hasExplicitChoice || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setThemeState(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [hasExplicitChoice]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    setHasExplicitChoice(true);
    setItem(KEYS.theme, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setItem(KEYS.theme, next);
      return next;
    });
    setHasExplicitChoice(true);
  }, []);

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
