import { useEffect, useRef } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import SectionHeading from '@/components/ui/SectionHeading.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { useReveal } from '@/hooks/useReveal.js';
import { countUp } from '@/lib/anim.js';
import { formatDateTime, matchStatusText } from '@/lib/format.js';
import styles from './FeaturedMatch.module.css';

function useCountUp(value, key, ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (value === null || value === undefined) {
      el.textContent = '–';
      return undefined;
    }
    const anim = countUp(el, value, { from: 0, duration: 1100 });
    return () => {
      anim?.pause();
      el.textContent = String(value);
    };
  }, [value, key, ref]);
}

function ScoreDigit({ value, matchId, className }) {
  const ref = useRef(null);
  useCountUp(value, matchId, ref);
  return (
    <span ref={ref} className={className}>
      {value ?? '–'}
    </span>
  );
}

const TITLES = {
  live: { eyebrow: 'Live now', title: 'Match of the moment', desc: 'The busiest scoreline currently in play.' },
  upcoming: { eyebrow: 'Coming up', title: 'Next big fixture', desc: 'The headline kickoff from today’s schedule.' },
  finished: { eyebrow: 'Latest result', title: 'Final whistle', desc: 'The most recent full-time score from a top competition.' },
};

export default function FeaturedMatch({ featured, loading }) {
  const ref = useReveal([featured?.match?.id, loading]);
  if (!loading && !featured) return null;
  const match = featured?.match;
  const meta = TITLES[featured?.reason] || TITLES.upcoming;
  const status = match ? matchStatusText(match) : '';
  const isLive = Boolean(match?.isLive);

  return (
    <section className="container" ref={ref} aria-labelledby="featured-title">
      <SectionHeading eyebrow={meta.eyebrow} title={meta.title} description={meta.desc} as="h2" />
      {loading || !match ? (
        <div className={styles.skeleton} aria-hidden="true">
          <Skeleton width="30%" height={14} />
          <div className={styles.skRow}>
            <Skeleton width={72} height={72} circle />
            <Skeleton width={140} height={56} />
            <Skeleton width={72} height={72} circle />
          </div>
          <Skeleton width="40%" height={14} />
        </div>
      ) : (
        <article className={[styles.card, isLive && styles.live].filter(Boolean).join(' ')} data-reveal>
          <span className={styles.glow} aria-hidden="true" />
          <header className={styles.top}>
            <span className={styles.comp}>
              {match.competition?.badge ? (
                <TeamBadge src={match.competition.badge} name={match.competition.name} size={26} />
              ) : (
                <Flame size={16} aria-hidden="true" />
              )}
              <span className={styles.compName}>
                {match.competition?.name}
                {match.competition?.country ? <span className={styles.compCountry}> · {match.competition.country}</span> : null}
              </span>
            </span>
            <span className={[styles.status, isLive && styles.statusLive].filter(Boolean).join(' ')}>
              {isLive && <span className={styles.dot} aria-hidden="true" />}
              {isLive ? status : match.statusLabel || status}
            </span>
          </header>

          <div className={styles.body}>
            <div className={`${styles.team} ${styles.home}`}>
              <TeamBadge src={match.home?.badge} name={match.home?.name} size={84} className={styles.badge} />
              <span className={styles.teamName} id="featured-title">
                {match.home?.name}
              </span>
            </div>
            <div className={styles.center}>
              {match.homeScore === null || match.homeScore === undefined ? (
                <span className={styles.kick}>
                  <span className={styles.kickTime}>{formatDateTime(match.startTime)}</span>
                  <span className={styles.kickLabel}>Kick-off</span>
                </span>
              ) : (
                <span className={styles.score} aria-label={`${match.homeScore} ${match.awayScore}`}>
                  <ScoreDigit value={match.homeScore} matchId={match.id} className={styles.digit} />
                  <span className={styles.sep}>–</span>
                  <ScoreDigit value={match.awayScore} matchId={match.id} className={styles.digit} />
                </span>
              )}
              {match.aggregate && (
                <span className={styles.agg}>
                  Agg {match.aggregate.home}–{match.aggregate.away}
                </span>
              )}
            </div>
            <div className={`${styles.team} ${styles.away}`}>
              <TeamBadge src={match.away?.badge} name={match.away?.name} size={84} className={styles.badge} />
              <span className={styles.teamName}>{match.away?.name}</span>
            </div>
          </div>

          <footer className={styles.foot}>
            <span className={styles.when}>{formatDateTime(match.startTime)}</span>
            <Button to={`/match/${match.id}`} variant="gradient" size="md">
              Match centre <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </footer>
        </article>
      )}
    </section>
  );
}
