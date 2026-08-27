import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery.js';
import { animate, utils } from '@/lib/anim.js';
import { formatTime, matchStatusText } from '@/lib/format.js';
import { compareMatches, competitionRank } from '@/features/matches/useMatches.js';
import styles from './LiveTicker.module.css';

const MAX_ITEMS = 24;
const PX_PER_SECOND = 55;

const byPriority = (a, b) => competitionRank(a.competition) - competitionRank(b.competition) || compareMatches(a, b);

function pickItems(matches, now = Date.now()) {
  const live = matches.filter((m) => m.isLive).sort(byPriority);
  if (live.length) return { mode: 'live', items: live.slice(0, MAX_ITEMS) };
  const upcoming = matches
    .filter((m) => m.phase === 'upcoming' && new Date(m.startTime).getTime() >= now - 5 * 60_000)
    .sort(compareMatches);
  if (upcoming.length) return { mode: 'today', items: upcoming.slice(0, MAX_ITEMS) };
  const finished = matches.filter((m) => m.isFinished || m.phase === 'finished').sort((a, b) => byPriority(a, b));
  if (finished.length) return { mode: 'results', items: finished.slice(0, MAX_ITEMS) };
  return { mode: 'none', items: [] };
}

const LABELS = { live: 'Live', today: 'Today', results: 'Results', none: 'Today' };

function TickerItem({ match, mode }) {
  const hasScore = match.homeScore !== null && match.homeScore !== undefined;
  return (
    <li className={styles.item}>
      <Link to={`/match/${match.id}`} className={styles.link} tabIndex={-1}>
        <span className={styles.team}>{match.home?.abbr || match.home?.name}</span>
        {hasScore ? (
          <span className={[styles.score, mode === 'live' && styles.scoreLive].filter(Boolean).join(' ')}>
            {match.homeScore}–{match.awayScore}
          </span>
        ) : (
          <span className={styles.time}>{formatTime(match.startTime)}</span>
        )}
        <span className={styles.team}>{match.away?.abbr || match.away?.name}</span>
        {mode === 'live' && <span className={styles.minute}>{matchStatusText(match)}</span>}
        {mode === 'results' && <span className={styles.minute}>{matchStatusText(match)}</span>}
      </Link>
    </li>
  );
}

export default function LiveTicker({ matches = [], loading = false }) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const firstRef = useRef(null);
  const [copies, setCopies] = useState(2);

  const { mode, items } = useMemo(() => pickItems(matches), [matches]);
  const key = items.map((m) => `${m.id}:${m.homeScore}:${m.awayScore}:${m.status}`).join('|');

  // How many copies of the list are needed to cover the viewport + one extra for the seam.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !items.length || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const w = firstRef.current?.offsetWidth || 0;
      if (!w) return;
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / w) + 1));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Seamless marquee: translate by exactly one copy's width, then loop.
  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const width = firstRef.current?.offsetWidth || 0;
    if (!track || !viewport || !width || reduced) return undefined;
    let anim;
    try {
      anim = animate(track, { translateX: [0, -width], duration: (width / PX_PER_SECOND) * 1000, ease: 'linear', loop: true });
    } catch {
      return undefined;
    }
    const pause = () => anim.pause();
    const play = () => anim.play();
    viewport.addEventListener('pointerenter', pause);
    viewport.addEventListener('pointerleave', play);
    viewport.addEventListener('focusin', pause);
    viewport.addEventListener('focusout', play);
    return () => {
      anim.pause();
      utils.set(track, { translateX: 0 });
      viewport.removeEventListener('pointerenter', pause);
      viewport.removeEventListener('pointerleave', play);
      viewport.removeEventListener('focusin', pause);
      viewport.removeEventListener('focusout', play);
    };
  }, [key, copies, reduced]);

  if (!loading && !items.length) {
    return (
      <div className={styles.ticker} id="home-content">
        <span className={styles.pill}>{LABELS.none}</span>
        <div className={styles.viewport}>
          <span className={styles.emptyText}>No fixtures scheduled today — check the calendar for upcoming matches.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ticker} id="home-content" aria-label={`${LABELS[mode]} scores`}>
      <span className={[styles.pill, mode === 'live' && styles.pillLive].filter(Boolean).join(' ')}>
        {mode === 'live' && <span className={styles.dot} aria-hidden="true" />}
        {LABELS[mode]}
      </span>
      <div ref={viewportRef} className={styles.viewport}>
        {loading && !items.length ? (
          <div className={styles.skeletons} aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width={150} height={20} />
            ))}
          </div>
        ) : (
          <div ref={trackRef} className={styles.track}>
            {Array.from({ length: copies }).map((_, c) => (
              <ul key={c} ref={c === 0 ? firstRef : undefined} className={styles.list} aria-hidden={c > 0 || undefined}>
                {items.map((m) => (
                  <TickerItem key={m.id} match={m} mode={mode} />
                ))}
              </ul>
            ))}
          </div>
        )}
      </div>
      <Link to={mode === 'live' ? '/matches?filter=live' : '/matches'} className={styles.all}>
        All matches
      </Link>
    </div>
  );
}
