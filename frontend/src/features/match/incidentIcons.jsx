import { ArrowDown, ArrowUp, Info, Monitor } from 'lucide-react';
import { INCIDENT_META } from './incidentMeta.js';
import styles from './incidentIcons.module.css';

/** Football (soccer ball) glyph. `tone` = default | own | missed | penalty */
export function BallIcon({ size = 18, tone = 'default', title }) {
  return (
    <svg
      className={[styles.ball, styles[tone]].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10.5" className={styles.ballBg} />
      <path
        className={styles.ballInk}
        d="M12 6.2l3.9 2.9-1.5 4.6H9.6L8.1 9.1 12 6.2zM12 2.5l1 2.6M17.9 6.8l2.3-.4M17.6 13.6l1.9 2.1M6.4 13.6l-1.9 2.1M6.1 6.8l-2.3-.4M9.7 14.6l-1.2 3.7M14.3 14.6l1.2 3.7"
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path className={styles.ballInk} d="M12 6.2l3.9 2.9-1.5 4.6H9.6L8.1 9.1z" />
      {tone === 'missed' && <path className={styles.cross} d="M5 5l14 14M19 5L5 19" fill="none" strokeWidth="2.4" strokeLinecap="round" />}
    </svg>
  );
}

/** Card glyph: yellow | red | yellow-red */
export function CardIcon({ kind = 'yellow', size = 18, title }) {
  const cls = [styles.card, kind === 'red' && styles.red, kind === 'yellow-red' && styles.yellowRed].filter(Boolean).join(' ');
  return (
    <span
      className={cls}
      style={{ '--sz': `${size}px` }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    />
  );
}

export function SubIcon({ size = 18, title }) {
  return (
    <span className={styles.sub} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'}>
      <ArrowUp size={size - 4} className={styles.subIn} />
      <ArrowDown size={size - 4} className={styles.subOut} />
    </span>
  );
}

/** Icon for a normalized incident type. */
export function IncidentIcon({ type, size = 18 }) {
  const title = INCIDENT_META[type]?.label || 'Event';
  switch (type) {
    case 'goal':
      return <BallIcon size={size} title={title} />;
    case 'penalty':
      return <BallIcon size={size} tone="penalty" title={title} />;
    case 'own-goal':
      return <BallIcon size={size} tone="own" title={title} />;
    case 'missed-penalty':
      return <BallIcon size={size} tone="missed" title={title} />;
    case 'yellow':
      return <CardIcon kind="yellow" size={size} title={title} />;
    case 'yellow-red':
      return <CardIcon kind="yellow-red" size={size} title={title} />;
    case 'red':
      return <CardIcon kind="red" size={size} title={title} />;
    case 'substitution':
      return <SubIcon size={size} title={title} />;
    case 'var':
      return <Monitor size={size - 2} aria-label={title} role="img" />;
    default:
      return <Info size={size - 2} aria-label={title} role="img" />;
  }
}
