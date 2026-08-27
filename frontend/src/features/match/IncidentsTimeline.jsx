import { useEffect, useRef } from 'react';
import { ArrowDown, Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import { animate, ensureVisible, prefersReducedMotion, stagger } from '@/lib/anim.js';
import { formatDateTime } from '@/lib/format.js';
import Card from '@/components/ui/Card.jsx';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { IncidentIcon } from './incidentIcons.jsx';
import { INCIDENT_META } from './incidentMeta.js';
import { useCountdown } from './useCountdown.js';
import styles from './IncidentsTimeline.module.css';

function minuteText(ev) {
  const base = `${ev.minute}'`;
  return ev.minuteExtended ? `${base}+${ev.minuteExtended}` : base;
}

/** "VAR:disallowed_offside" -> "VAR: disallowed offside" */
function prettyReason(reason) {
  return String(reason)
    .replace(/[_-]+/g, ' ')
    .replace(/:\s*/g, ': ')
    .trim();
}

function EventBody({ ev }) {
  const name = ev.player?.name || INCIDENT_META[ev.type]?.label || 'Event';
  const isGoal = ev.type === 'goal' || ev.type === 'penalty' || ev.type === 'own-goal';
  return (
    <div className={styles.body} data-type={ev.type}>
      <span className={styles.icon}>
        <IncidentIcon type={ev.type} size={20} />
      </span>
      <div className={styles.text}>
        {ev.type === 'substitution' ? (
          <>
            <span className={styles.name}>{ev.player?.name || 'Substitute'}</span>
            {ev.playerOut?.name && (
              <span className={styles.subOut}>
                <ArrowDown size={11} /> {ev.playerOut.name}
              </span>
            )}
          </>
        ) : (
          <>
            <span className={styles.name}>
              {name}
              {ev.type === 'penalty' && <span className={styles.tag}>pen</span>}
              {ev.type === 'own-goal' && <span className={`${styles.tag} ${styles.tagDanger}`}>og</span>}
              {ev.type === 'missed-penalty' && <span className={`${styles.tag} ${styles.tagMuted}`}>missed pen</span>}
              {ev.type === 'yellow-red' && <span className={`${styles.tag} ${styles.tagDanger}`}>2nd yellow</span>}
            </span>
            {isGoal && ev.score && (
              <span className={styles.scoreTag}>
                {ev.score[0]} – {ev.score[1]}
              </span>
            )}
            {ev.assist?.name && <span className={styles.assist}>assist: {ev.assist.name}</span>}
            {ev.reason && <span className={styles.assist}>{prettyReason(ev.reason)}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function KickoffPanel({ match }) {
  const countdown = useCountdown(match.startTime);
  const comp = match.competition || {};
  return (
    <Card className={styles.kickoff}>
      <div className={styles.kickTeams}>
        <TeamBadge src={match.home.badge} name={match.home.name} size={44} />
        <span className={styles.kickVs}>vs</span>
        <TeamBadge src={match.away.badge} name={match.away.name} size={44} />
      </div>
      <p className={styles.kickEyebrow}>
        <Clock size={14} /> {countdown.isPast ? 'Kick-off' : 'Kick-off in'}
      </p>
      <p className={`${styles.kickCount} tabular`} aria-live="polite">
        {countdown.isPast ? 'Starting soon' : countdown.text}
      </p>
      <ul className={styles.kickMeta}>
        <li>
          <Calendar size={14} /> {formatDateTime(match.startTime)}
        </li>
        {comp.name && (
          <li>
            <Trophy size={14} /> {comp.name}
            {comp.stageName ? ` · ${comp.stageName}` : ''}
          </li>
        )}
        {match.venue?.name && (
          <li>
            <MapPin size={14} /> {match.venue.name}
            {match.venue.city ? `, ${match.venue.city}` : ''}
          </li>
        )}
      </ul>
    </Card>
  );
}

/**
 * Props: incidents (normalized Incidents) and match (MatchDetail).
 * For upcoming matches pass `incidents` = null and it renders the kickoff panel.
 */
export default function IncidentsTimeline({ incidents, match }) {
  const rootRef = useRef(null);
  const periods = (incidents?.periods || []).filter((p) => p.events?.length);
  const eventCount = periods.reduce((n, p) => n + p.events.length, 0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !eventCount) return undefined;
    const events = Array.from(root.querySelectorAll('[data-ev]'));
    const heads = Array.from(root.querySelectorAll('[data-head]'));
    if (prefersReducedMotion() || !events.length) return undefined;
    let anim;
    try {
      animate(heads, { opacity: [0, 1], scale: [0.8, 1], duration: 500, ease: 'outBack(1.4)', delay: stagger(120) });
      anim = animate(events, { opacity: [0, 1], y: [14, 0], duration: 650, ease: 'outExpo', delay: stagger(45, { start: 80 }) });
    } catch {
      ensureVisible([...events, ...heads]);
    }
    const safety = setTimeout(() => ensureVisible([...events, ...heads]), 3000);
    return () => {
      clearTimeout(safety);
      anim?.pause();
      ensureVisible([...events, ...heads]);
    };
  }, [eventCount]);

  if (match?.phase === 'upcoming') return <KickoffPanel match={match} />;

  return (
    <div ref={rootRef} className={styles.wrap}>
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendTeam}>
          <TeamBadge src={match.home.badge} name={match.home.name} size={22} /> {match.home.name}
        </span>
        <span className={styles.legendTeam}>
          {match.away.name} <TeamBadge src={match.away.badge} name={match.away.name} size={22} />
        </span>
      </div>

      <ol className={styles.timeline}>
        {periods.map((p) => (
          <li key={p.period} className={styles.period}>
            <div className={styles.periodHead} data-head>
              <span>{p.label}</span>
            </div>
            <ol className={styles.events}>
              {p.events.map((ev, i) => (
                <li key={`${p.period}-${i}`} className={`${styles.event} ${ev.team === 'away' ? styles.away : styles.home}`} data-ev>
                  <div className={styles.side}>{ev.team === 'home' && <EventBody ev={ev} />}</div>
                  <div className={styles.minute}>
                    <span className="tabular">{minuteText(ev)}</span>
                  </div>
                  <div className={styles.side}>{ev.team === 'away' && <EventBody ev={ev} />}</div>
                </li>
              ))}
            </ol>
            {p.period === 1 && incidents?.halfTime?.home !== null && incidents?.halfTime?.home !== undefined && (
              <div className={styles.periodFoot} data-head>
                <span>
                  HT {incidents.halfTime.home} – {incidents.halfTime.away}
                </span>
              </div>
            )}
          </li>
        ))}
        {match.isFinished && incidents?.homeScore !== null && incidents?.homeScore !== undefined && (
          <li className={styles.finalLine} data-head>
            <span>
              FT {incidents.homeScore} – {incidents.awayScore}
            </span>
          </li>
        )}
      </ol>
    </div>
  );
}
