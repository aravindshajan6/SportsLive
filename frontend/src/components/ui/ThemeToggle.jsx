import { useEffect, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext.jsx';
import { animate, prefersReducedMotion, utils } from '@/lib/anim.js';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme();
  const sunRef = useRef(null);
  const moonRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    const showEl = isDark ? moonRef.current : sunRef.current;
    const hideEl = isDark ? sunRef.current : moonRef.current;
    if (!showEl || !hideEl) return;
    if (first.current || prefersReducedMotion()) {
      first.current = false;
      utils.set(showEl, { opacity: 1, rotate: 0, scale: 1 });
      utils.set(hideEl, { opacity: 0, rotate: 90, scale: 0.4 });
      return;
    }
    animate(hideEl, { opacity: 0, rotate: 90, scale: 0.4, duration: 350, ease: 'inBack(1.5)' });
    animate(showEl, { opacity: [0, 1], rotate: [-90, 0], scale: [0.4, 1], duration: 550, delay: 150, ease: 'outBack(1.6)' });
  }, [isDark]);

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span ref={sunRef} className={styles.icon}>
        <Sun size={19} />
      </span>
      <span ref={moonRef} className={styles.icon}>
        <Moon size={19} />
      </span>
    </button>
  );
}
