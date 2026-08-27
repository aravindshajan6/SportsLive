import { useEffect, useMemo, useRef } from 'react';
import { animate, prefersReducedMotion, utils } from '@/lib/anim.js';
import { passwordStrength } from './validation.js';
import styles from './Forms.module.css';

const TONES = ['', 'weak', 'fair', 'good', 'strong'];

/** Four-segment password strength meter; segments pop in with anime.js as the score rises. */
export default function PasswordStrength({ value = '', id }) {
  const { score, label, hint } = useMemo(() => passwordStrength(value), [value]);
  const barRef = useRef(null);
  const prevScore = useRef(0);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const segs = Array.from(bar.querySelectorAll('[data-seg]'));
    const from = prevScore.current;
    prevScore.current = score;
    if (prefersReducedMotion() || score <= from) return undefined;
    const fresh = segs.slice(from, score);
    if (!fresh.length) return undefined;
    const anim = animate(fresh, { scaleY: [0.3, 1.25, 1], duration: 420, ease: 'outBack(2)' });
    return () => {
      anim.pause();
      utils.set(fresh, { scaleY: 1 });
    };
  }, [score]);

  return (
    <div className={`${styles.strength} ${score ? styles[TONES[score]] : ''}`} id={id} aria-live="polite">
      <div className={styles.strengthBar} ref={barRef} role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-label="Password strength">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} data-seg className={`${styles.seg} ${i < score ? styles.segOn : ''}`} />
        ))}
      </div>
      <div className={styles.strengthText}>
        <span className={styles.strengthLabel}>{label || 'Password strength'}</span>
        <span className={styles.strengthHint}>{hint}</span>
      </div>
    </div>
  );
}
