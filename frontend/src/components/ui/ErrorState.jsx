import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import styles from './State.module.css';

export default function ErrorState({ title = 'Something went wrong', error, onRetry, className }) {
  const message = typeof error === 'string' ? error : error?.message;
  return (
    <div className={[styles.state, styles.danger, className].filter(Boolean).join(' ')} role="alert">
      <span className={styles.icon}>
        <AlertTriangle size={26} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.desc}>{message}</p>}
      {onRetry && (
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}
