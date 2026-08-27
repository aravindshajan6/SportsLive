import { useEffect, useRef } from 'react';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { animate, ensureVisible, prefersReducedMotion, stagger } from '@/lib/anim.js';
import styles from './StatsBars.module.css';

function fmt(row, v) {
  if (v === null || v === undefined) return '–';
  if (row.unit === '%') return `${v}%`;
  if (row.key === 'xg') return Number(v).toFixed(2);
  return String(v);
}

/** Symmetric stat bars: home grows leftwards from the centre, away rightwards. */
export default function StatsBars({ stats, match }) {
  const rootRef = useRef(null);
  const rows = stats?.rows || [];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !rows.length) return undefined;
    const bars = Array.from(root.querySelectorAll('[data-bar]'));
    const lines = Array.from(root.querySelectorAll('[data-row]'));
    if (prefersReducedMotion()) return undefined;
    let anim;
    try {
      animate(lines, { opacity: [0, 1], y: [8, 0], duration: 500, ease: 'outQuad', delay: stagger(35) });
      anim = animate(bars, { scaleX: [0, 1], duration: 950, ease: 'outExpo', delay: stagger(35, { start: 120 }) });
    } catch {
      ensureVisible([...bars, ...lines]);
    }
    const safety = setTimeout(() => ensureVisible([...bars, ...lines]), 3000);
    return () => {
      clearTimeout(safety);
      anim?.pause();
      ensureVisible([...bars, ...lines]);
    };
  }, [rows.length]);

  return (
    <div ref={rootRef} className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.teamHead}>
          <TeamBadge src={match.home.badge} name={match.home.name} size={26} />
          <span className={`truncate ${styles.teamName}`}>{match.home.name}</span>
        </span>
        <span className={styles.headLabel}>Team stats</span>
        <span className={`${styles.teamHead} ${styles.teamHeadAway}`}>
          <span className={`truncate ${styles.teamName}`}>{match.away.name}</span>
          <TeamBadge src={match.away.badge} name={match.away.name} size={26} />
        </span>
      </div>

      <ul className={styles.rows}>
        {rows.map((row) => {
          const h = Number(row.home) || 0;
          const a = Number(row.away) || 0;
          const total = h + a;
          const hp = total > 0 ? (h / total) * 100 : 0;
          const ap = total > 0 ? (a / total) * 100 : 0;
          const lead = h === a ? null : h > a ? 'home' : 'away';
          return (
            <li key={row.key} className={styles.row} data-row>
              <div className={styles.values}>
                <span className={[styles.val, lead === 'home' && styles.lead].filter(Boolean).join(' ')}>{fmt(row, row.home)}</span>
                <span className={styles.label}>{row.label}</span>
                <span className={[styles.val, lead === 'away' && styles.lead].filter(Boolean).join(' ')}>{fmt(row, row.away)}</span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <div className={styles.halfL}>
                  <span className={[styles.bar, styles.barHome, lead === 'home' && styles.barLead].filter(Boolean).join(' ')} style={{ width: `${hp}%` }} data-bar />
                </div>
                <div className={styles.halfR}>
                  <span className={[styles.bar, styles.barAway, lead === 'away' && styles.barLead].filter(Boolean).join(' ')} style={{ width: `${ap}%` }} data-bar />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
