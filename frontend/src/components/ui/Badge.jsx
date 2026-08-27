import styles from './Badge.module.css';

/** variant: neutral | accent | info | success | warn | danger | outline | live */
export default function Badge({ variant = 'neutral', pulse = false, className, children, ...rest }) {
  const cls = [styles.badge, variant !== 'neutral' && styles[variant], className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {pulse && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function LiveBadge({ children = 'Live', ...rest }) {
  return (
    <Badge variant="live" pulse {...rest}>
      {children}
    </Badge>
  );
}
