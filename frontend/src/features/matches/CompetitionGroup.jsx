import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Trophy } from 'lucide-react';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import MatchCard from './MatchCard.jsx';
import styles from './CompetitionGroup.module.css';

function stageSuffix(group) {
  const { name = '', stageName = '' } = group;
  if (!stageName || stageName === name) return '';
  if (stageName.startsWith(`${name}:`)) return stageName.slice(name.length + 1).trim();
  if (stageName.startsWith(name)) return stageName.slice(name.length).replace(/^[\s:·-]+/, '').trim();
  return stageName;
}

/**
 * Collapsible list of matches for one competition.
 * @param {{ group: object, defaultOpen?: boolean, compact?: boolean, limit?: number, moreTo?: string, showCompetition?: boolean }} props
 */
export default function CompetitionGroup({
  group,
  defaultOpen = true,
  compact = false,
  limit,
  moreTo,
  showCompetition = false,
  className,
  ...rest
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const shown = limit ? group.matches.slice(0, limit) : group.matches;
  const hidden = group.matches.length - shown.length;
  const liveCount = group.matches.filter((m) => m.isLive).length;
  const stage = stageSuffix(group);

  return (
    <section
      className={[styles.group, open && styles.open, className].filter(Boolean).join(' ')}
      style={{ '--comp-color': group.color || 'var(--accent)' }}
      {...rest}
    >
      <h3 className={styles.heading}>
        <button
          type="button"
          className={styles.head}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={styles.bar} aria-hidden="true" />
          {group.badge ? (
            <TeamBadge src={group.badge} name={group.name} size={28} className={styles.compBadge} />
          ) : (
            <span className={styles.compIcon} aria-hidden="true">
              <Trophy size={14} />
            </span>
          )}
          <span className={styles.names}>
            <span className={styles.name}>{group.name}</span>
            <span className={styles.sub}>
              {group.country}
              {stage ? ` · ${stage}` : ''}
            </span>
          </span>
          {liveCount > 0 && (
            <span className={styles.live}>
              <span className={styles.liveDot} aria-hidden="true" />
              {liveCount} live
            </span>
          )}
          <span className={styles.count}>{group.matches.length}</span>
          <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
        </button>
      </h3>

      <div id={panelId} className={styles.body} hidden={!open}>
        <div className={styles.inner}>
          <ul className={styles.list}>
            {shown.map((m) => (
              <li key={m.id}>
                <MatchCard match={m} compact={compact} showCompetition={showCompetition} />
              </li>
            ))}
          </ul>
          {hidden > 0 && moreTo && (
            <Link to={moreTo} className={styles.more}>
              +{hidden} more in {group.name}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
