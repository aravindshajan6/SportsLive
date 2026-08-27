import { useState } from 'react';
import { initials } from '@/lib/format.js';
import styles from './TeamBadge.module.css';

export default function TeamBadge({ src, name = '', size = 40, className, ...rest }) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <span className={[styles.wrap, className].filter(Boolean).join(' ')} style={{ '--size': `${size}px` }} {...rest}>
      {showImg ? (
        <img
          className={styles.img}
          src={src}
          alt={name ? `${name} badge` : ''}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.fallback} aria-label={name}>
          {initials(name) || '?'}
        </span>
      )}
    </span>
  );
}
