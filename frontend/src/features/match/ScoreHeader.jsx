import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Trophy } from 'lucide-react';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import Badge, { LiveBadge } from '@/components/ui/Badge.jsx';
import { formatDateTime, formatTime } from '@/lib/format.js';
import { animate, countUp, createTimeline, ensureVisible, prefersReducedMotion, stagger } from '@/lib/anim.js';
import { useIsMobile } from '@/hooks/useMediaQuery.js';
import { useCountdown } from './useCountdown.js';
import styles from './ScoreHeader.module.css';

function finishedLabel(match) {
  switch (match.status) {
    case 'FT':
      return 'Full time';
    case 'AET':
      return 'After extra time';
    case 'AP':
      return 'Penalties';
    default:
      return match.statusLabel || match.status;
  }
}

function StatusPill({ match }) {
  const countdown = useCountdown(match.phase === 'upcoming' ? match.startTime : null);
  if (match.isLive) {
    const isHT = match.status === 'HT';
    return (
      <LiveBadge className={`${styles.pill} ${styles.pillLive}`}>
        <span className={styles.minute}>{isHT ? 'Half time' : match.statusLabel || match.status}</span>
      </LiveBadge>
    );
  }
  if (match.isFinished) {
    return (
      <Badge variant="outline" className={`${styles.pill} ${styles.pillFt}`}>
        {finishedLabel(match)}
      </Badge>
    );
  }
  if (match.phase === 'upcoming') {
    const label = countdown.isSoon
      ? `Kick-off in ${countdown.text}`
      : countdown.isPast
        ? 'Starting soon'
        : countdown.text || formatDateTime(match.startTime);
    return (
      <Badge variant="info" className={`${styles.pill} ${styles.pillSoon}`}>
        <span className="tabular">{label}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="warn" className={styles.pill}>
      {match.statusLabel || match.status}
    </Badge>
  );
}

/** Animate a score digit: blur/scale out, swap the text, spring back in. */
function flipTo(el, value) {
  if (!el) return;
  const text = String(value);
  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }
  const safety = setTimeout(() => {
    el.textContent = text;
    el.style.filter = '';
    ensureVisible(el);
  }, 1200);
  try {
    animate(el, {
      scale: [1, 1.35],
      opacity: [1, 0],
      y: [0, -14],
      filter: ['blur(0px)', 'blur(10px)'],
      duration: 220,
      ease: 'inQuad',
      onComplete: () => {
        el.textContent = text;
        animate(el, {
          scale: [1.35, 1],
          opacity: [0, 1],
          y: [14, 0],
          filter: ['blur(10px)', 'blur(0px)'],
          duration: 520,
          ease: 'outBack(1.5)',
          onComplete: () => {
            clearTimeout(safety);
            el.style.filter = '';
          },
        });
      },
    });
  } catch {
    clearTimeout(safety);
    el.textContent = text;
    el.style.filter = '';
    ensureVisible(el);
  }
}

function Team({ team, side, winner, size }) {
  const isWinner = winner === side;
  const isLoser = winner && winner !== 'draw' && !isWinner;
  return (
    <div className={[styles.team, styles[side], isWinner && styles.winner, isLoser && styles.loser].filter(Boolean).join(' ')}>
      <span className={styles.badgeWrap} data-pop>
        <TeamBadge src={team.badge} name={team.name} size={size} className={styles.badge} />
      </span>
      <span className={styles.teamName} data-rise>
        {team.name}
      </span>
      <span className={styles.abbr} data-rise>
        {team.abbr}
        {isWinner && <span className={styles.winTag}>Winner</span>}
      </span>
    </div>
  );
}

export default function ScoreHeader({ match }) {
  const rootRef = useRef(null);
  const homeRef = useRef(null);
  const awayRef = useRef(null);
  const isMobile = useIsMobile();
  const hasScore = match.homeScore !== null && match.homeScore !== undefined;
  const [shown, setShown] = useState(() => [match.homeScore, match.awayScore]);
  const prevRef = useRef(null);

  // Count-up on first load; flip on later changes (live polling).
  useEffect(() => {
    const next = [match.homeScore, match.awayScore];
    const has = next[0] !== null && next[0] !== undefined;
    const prev = prevRef.current;
    prevRef.current = has ? next : null;
    if (!has) return;
    if (!prev) {
      countUp(homeRef.current, next[0]);
      countUp(awayRef.current, next[1]);
      return;
    }
    if (prev[0] !== next[0]) flipTo(homeRef.current, next[0]);
    if (prev[1] !== next[1]) flipTo(awayRef.current, next[1]);
    // keep React's rendered text in sync after the DOM animation
    const t = setTimeout(() => setShown(next), 260);
    return () => clearTimeout(t);
  }, [match.homeScore, match.awayScore]);

  // Entrance timeline.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const pops = Array.from(root.querySelectorAll('[data-pop]'));
    const rises = Array.from(root.querySelectorAll('[data-rise]'));
    if (prefersReducedMotion()) return undefined;
    let tl;
    try {
      tl = createTimeline({ defaults: { ease: 'outExpo' } })
        .add(root, { opacity: [0, 1], y: [18, 0], duration: 650 })
        .add(rises, { opacity: [0, 1], y: [12, 0], duration: 600, delay: stagger(60) }, '-=420')
        .add(pops, { opacity: [0, 1], scale: [0.4, 1], duration: 750, ease: 'outBack(1.7)', delay: stagger(140) }, '-=560');
    } catch {
      ensureVisible([root, ...pops, ...rises]);
    }
    const safety = setTimeout(() => ensureVisible([root, ...pops, ...rises]), 2500);
    return () => {
      clearTimeout(safety);
      tl?.pause();
      ensureVisible([root, ...pops, ...rises]);
    };
  }, []);

  const comp = match.competition || {};
  const venue = match.venue;
  const badgeSize = isMobile ? 56 : 72;
  const ht = match.halfTime;
  const hasHT = ht && ht.home !== null && ht.home !== undefined && (match.isFinished || match.isLive);
  const agg = match.aggregate;
  const scoreValue = (v) => (v === null || v === undefined ? '–' : v);

  return (
    <section ref={rootRef} className={styles.hero} aria-label="Match score">
      <span className={styles.glowA} aria-hidden="true" />
      <span className={styles.glowB} aria-hidden="true" />

      <div className={styles.topbar}>
        <Link to="/matches" className={styles.back}>
          <ArrowLeft size={16} /> <span>Matches</span>
        </Link>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={14} /> {formatDateTime(match.startTime)}
          </span>
          {venue?.name && (
            <span className={styles.metaItem}>
              <MapPin size={14} /> {venue.name}
              {venue.city ? `, ${venue.city}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className={styles.comp} data-rise>
        <Trophy size={15} />
        <span className={styles.compName}>{comp.name}</span>
        {comp.country && <span className={styles.compSep}>·</span>}
        {comp.country && <span>{comp.country}</span>}
        {comp.stageName && comp.stageName !== comp.name && <span className={styles.compSep}>·</span>}
        {comp.stageName && comp.stageName !== comp.name && <span>{comp.stageName}</span>}
      </div>

      <div className={styles.main}>
        <Team team={match.home} side="home" winner={match.winner} size={badgeSize} />

        <div className={styles.centre}>
          <div data-rise>
            <StatusPill match={match} />
          </div>
          {hasScore ? (
            <div className={styles.score} aria-label={`Score ${match.homeScore} ${match.awayScore}`} data-rise>
              <span ref={homeRef} className={styles.digit}>
                {scoreValue(shown[0])}
              </span>
              <span className={styles.sep} aria-hidden="true">
                –
              </span>
              <span ref={awayRef} className={styles.digit}>
                {scoreValue(shown[1])}
              </span>
            </div>
          ) : (
            <div className={`${styles.score} ${styles.kickoff}`} data-rise>
              <span className={styles.digit}>{formatTime(match.startTime)}</span>
            </div>
          )}
          <div className={styles.sub} data-rise>
            {hasHT && (
              <span className={styles.subLine}>
                HT {ht.home} – {ht.away}
              </span>
            )}
            {agg && (
              <span className={styles.subLine}>
                Agg {agg.home} – {agg.away}
                {agg.totalLegs > 1 ? ` · Leg ${agg.leg}/${agg.totalLegs}` : ''}
              </span>
            )}
            {venue?.spectators ? <span className={styles.subLine}>{venue.spectators.toLocaleString()} spectators</span> : null}
          </div>
        </div>

        <Team team={match.away} side="away" winner={match.winner} size={badgeSize} />
      </div>
    </section>
  );
}
