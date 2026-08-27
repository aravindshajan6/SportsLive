import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { useTilt } from '@/hooks/useTilt.js';
import { animate, prefersReducedMotion, utils } from '@/lib/anim.js';
import { matchStatusText } from '@/lib/format.js';
import styles from './MatchCard.module.css';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/** Flip/scale a score digit when its value changes for the same match (not on mount). */
function useScoreFlip(value, matchId, elRef, flashRef) {
  const prev = useRef({ matchId, value });
  useEffect(() => {
    const el = elRef.current;
    const flash = flashRef.current;
    const changed = prev.current.matchId === matchId && prev.current.value !== value;
    prev.current = { matchId, value };
    if (!changed || !el || prefersReducedMotion()) return undefined;
    const anims = [
      animate(el, { rotateX: [-90, 0], scale: [1.5, 1], opacity: [0.2, 1], duration: 750, ease: 'outBack(1.6)' }),
    ];
    if (flash) anims.push(animate(flash, { opacity: [0.9, 0], duration: 1400, ease: 'outQuad' }));
    return () => {
      anims.forEach((a) => a.pause());
      utils.set(el, { rotateX: 0, scale: 1, opacity: 1 });
      if (flash) utils.set(flash, { opacity: 0 });
    };
  }, [value, matchId, elRef, flashRef]);
}

function statusVariant(match) {
  if (match.isLive) return 'live';
  if (match.isFinished || match.phase === 'finished') return 'finished';
  if (['postponed', 'abandoned', 'cancelled'].includes(match.phase)) return 'warn';
  return 'upcoming';
}

/**
 * One fixture row. Whole card links to the match centre.
 * @param {{ match: object, compact?: boolean, showCompetition?: boolean, className?: string }} props
 */
export default function MatchCard({ match, compact = false, showCompetition = false, className, ...rest }) {
  const { ref, glareRef } = useTilt({ max: 4, scale: 1.012, disabled: compact });
  const homeRef = useRef(null);
  const awayRef = useRef(null);
  const flashRef = useRef(null);
  useScoreFlip(match.homeScore, match.id, homeRef, flashRef);
  useScoreFlip(match.awayScore, match.id, awayRef, flashRef);

  const hasScore = match.homeScore !== null && match.homeScore !== undefined;
  const finished = match.isFinished || match.phase === 'finished';
  const homeWin = finished && hasScore && match.homeScore > match.awayScore;
  const awayWin = finished && hasScore && match.awayScore > match.homeScore;
  const variant = statusVariant(match);
  const status = matchStatusText(match);
  const agg = match.aggregate;
  const comp = match.competition;
  const badgeSize = compact ? 24 : 30;

  const ariaLabel = `${match.home?.name} ${hasScore ? `${match.homeScore} – ${match.awayScore}` : 'vs'} ${match.away?.name}, ${
    match.isLive ? `live, ${status}` : match.statusLabel || status
  }`;

  return (
    <div className={cx(styles.perspective, className)} {...rest}>
      <Link
        ref={ref}
        to={`/match/${match.id}`}
        className={cx(styles.card, compact && styles.compact, match.isLive && styles.isLive, finished && styles.isFinished)}
        aria-label={ariaLabel}
      >
        <span ref={flashRef} className={styles.flash} aria-hidden="true" />
        {!compact && <span ref={glareRef} className={styles.glare} aria-hidden="true" />}

        <span className={cx(styles.status, styles[variant])}>
          {match.isLive && <span className={styles.dot} aria-hidden="true" />}
          {status}
        </span>

        <span className={styles.teams}>
          <span className={cx(styles.team, styles.home, homeWin && styles.winner, awayWin && styles.loser)}>
            <span className={styles.name}>{match.home?.name}</span>
            <TeamBadge src={match.home?.badge} name={match.home?.name} size={badgeSize} className={styles.badge} />
          </span>

          <span className={cx(styles.score, !hasScore && styles.noScore)} aria-hidden="true">
            {hasScore ? (
              <>
                <span ref={homeRef} className={styles.digit}>
                  {match.homeScore}
                </span>
                <span className={styles.sep}>–</span>
                <span ref={awayRef} className={styles.digit}>
                  {match.awayScore}
                </span>
              </>
            ) : (
              <span className={styles.vs}>vs</span>
            )}
          </span>

          <span className={cx(styles.team, styles.away, awayWin && styles.winner, homeWin && styles.loser)}>
            <TeamBadge src={match.away?.badge} name={match.away?.name} size={badgeSize} className={styles.badge} />
            <span className={styles.name}>{match.away?.name}</span>
          </span>
        </span>

        {(agg || (showCompetition && comp)) && (
          <span className={styles.meta}>
            {showCompetition && comp && (
              <span className={styles.comp}>
                {comp.name}
                {comp.country ? ` · ${comp.country}` : ''}
              </span>
            )}
            {agg && (
              <span className={styles.agg}>
                Agg {agg.home}–{agg.away}
                {agg.totalLegs > 1 ? ` · Leg ${agg.leg}/${agg.totalLegs}` : ''}
              </span>
            )}
          </span>
        )}
      </Link>
    </div>
  );
}
