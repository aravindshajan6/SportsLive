import { initials } from '@/lib/format.js';
import styles from './Avatar.module.css';

export default function Avatar({ name = '', size = 40, className, ...rest }) {
  return (
    <span className={[styles.avatar, className].filter(Boolean).join(' ')} style={{ '--size': `${size}px` }} title={name} {...rest}>
      {initials(name) || '?'}
    </span>
  );
}
