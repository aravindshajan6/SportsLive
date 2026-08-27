import { Inbox } from 'lucide-react';
import styles from './State.module.css';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, children, className }) {
  return (
    <div className={[styles.state, className].filter(Boolean).join(' ')} role="status">
      <span className={styles.icon}>
        <Icon size={26} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
