import styles from './Spinner.module.css';

export default function Spinner({ size = 28, center = false, label = 'Loading' }) {
  return (
    <span className={center ? styles.center : styles.wrap} role="status" aria-label={label}>
      <span className={styles.ring} style={{ '--size': `${size}px` }} />
    </span>
  );
}
