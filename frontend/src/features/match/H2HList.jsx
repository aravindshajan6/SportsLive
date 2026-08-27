import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { animate, countUp, ensureVisible, prefersReducedMotion, stagger } from '@/lib/anim.js';
import { formatDate } from '@/lib/format.js';
import styles from './H2HList.module.css';

function outcome(m, homeId, awayId) {
  if (m.homeScore === null || m.homeScore === undefined) return null;
  if (m.homeScore === m.awayScore) return 'draw';
  const winnerId = m.homeScore > m.awayScore ? m.home.id : m.away.id;
  if (winnerId === homeId) return 'home';
  if (winnerId === awayId) return 'away';
  return null;
}

export default function H2HList({ h2h, match }) {
  const rootRef = useRef(null);
  const list = useMemo(() => h2h?.matches || [], [h2h]);

  const summary = useMemo(() => {
    const s = { home: 0, draw: 0, away: 0 };
    list.forEach((m) => {
      const o = outcome(m, match.home.id, match.away.id);
      if (o) s[o] += 1;
    });
    return s;
  }, [list, match.home.id, match.away.id]);
  const total = summary.home + summary.draw + summary.away;
  const pct = (n) => (total ? (n / total) * 100 : 0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const nums = Array.from(root.querySelectorAll('[data-count]'));
    const bar = root.querySelector('[data-bar]');
    const rows = Array.from(root.querySelectorAll('[data-row]'));
    if (prefersReducedMotion()) return undefined;
    const anims = [];
    try {
      nums.forEach((el) => {
        const a = countUp(el, Number(el.dataset.count) || 0, { duration: 1000 });
        if (a) anims.push(a);
      });
      if (bar) anims.push(animate(bar, { scaleX: [0, 1], duration: 900, ease: 'outExpo', delay: 100 }));
      anims.push(animate(rows, { opacity: [0, 1], y: [12, 0], duration: 600, ease: 'outExpo', delay: stagger(40, { start: 150 }) }));
    } catch {
      ensureVisible([...rows, bar].filter(Boolean));
    }
    const safety = setTimeout(() => ensureVisible([...rows, bar].filter(Boolean)), 3000);
    return () => {
      clearTimeout(safety);
      anims.forEach((a) => a?.pause());
      ensureVisible([...rows, bar].filter(Boolean));
      nums.forEach((el) => {
        el.textContent = el.dataset.count;
      });
    };
  }, [list.length, summary.home, summary.draw, summary.away]);

  return (
    <div ref={rootRef} className={styles.wrap}>
      <section className={styles.summary} aria-label="Head to head summary">
        <div className={styles.tiles}>
          <div className={`${styles.tile} ${styles.tileHome}`}>
            <TeamBadge src={match.home.badge} name={match.home.name} size={28} />
            <span className={styles.tileNum} data-count={summary.home}>
              {summary.home}
            </span>
            <span className={styles.tileLabel}>{match.home.abbr || match.home.name} wins</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileNum} data-count={summary.draw}>
              {summary.draw}
            </span>
            <span className={styles.tileLabel}>Draws</span>
          </div>
          <div className={`${styles.tile} ${styles.tileAway}`}>
            <TeamBadge src={match.away.badge} name={match.away.name} size={28} />
            <span className={styles.tileNum} data-count={summary.away}>
              {summary.away}
            </span>
            <span className={styles.tileLabel}>{match.away.abbr || match.away.name} wins</span>
          </div>
        </div>
        {total > 0 && (
          <div className={styles.bar} data-bar aria-hidden="true">
            <span className={styles.segHome} style={{ width: `${pct(summary.home)}%` }} />
            <span className={styles.segDraw} style={{ width: `${pct(summary.draw)}%` }} />
            <span className={styles.segAway} style={{ width: `${pct(summary.away)}%` }} />
          </div>
        )}
        <p className={styles.summaryNote}>
          Last {list.length} meeting{list.length === 1 ? '' : 's'}
        </p>
      </section>

      <ol className={styles.list}>
        {list.map((m) => {
          const o = outcome(m, match.home.id, match.away.id);
          const homeWon = m.homeScore !== null && m.homeScore > m.awayScore;
          const awayWon = m.homeScore !== null && m.awayScore > m.homeScore;
          return (
            <li key={m.id} data-row>
              <Link to={`/match/${m.id}`} className={styles.row}>
                <div className={styles.rowMeta}>
                  <span className={styles.date}>{formatDate(m.date || m.startTime)}</span>
                  <span className={`truncate ${styles.compName}`}>{m.competition?.name}</span>
                </div>
                <div className={styles.rowMain}>
                  <span className={`${styles.rowTeam} ${styles.rowHome} ${homeWon ? styles.won : ''}`}>
                    <span className="truncate">{m.home.name}</span>
                    <TeamBadge src={m.home.badge} name={m.home.name} size={24} />
                  </span>
                  <span className={`${styles.rowScore} ${o ? styles[`o_${o}`] : ''}`}>
                    {m.homeScore ?? '–'} <span className={styles.dash}>–</span> {m.awayScore ?? '–'}
                  </span>
                  <span className={`${styles.rowTeam} ${styles.rowAway} ${awayWon ? styles.won : ''}`}>
                    <TeamBadge src={m.away.badge} name={m.away.name} size={24} />
                    <span className="truncate">{m.away.name}</span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
