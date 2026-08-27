import { useState } from 'react';
import { ArrowUpRight, Clock, PenLine } from 'lucide-react';
import { useTilt } from '@/hooks/useTilt.js';
import { timeAgo } from '@/lib/format.js';
import { sourceMeta, sourceVars } from './sources.js';
import styles from './ArticleCard.module.css';

/** Gradient fallback tile shown when an article has no image (or the image fails to load). */
export function SourceTile({ meta, className, compact = false }) {
  return (
    <div className={[styles.tile, compact && styles.tileCompact, className].filter(Boolean).join(' ')} style={sourceVars(meta)} aria-hidden="true">
      <span className={styles.tileRing} />
      <span className={`${styles.tileRing} ${styles.tileRing2}`} />
      <span className={styles.tileMono}>{meta.mono}</span>
      {meta.name.toUpperCase() !== meta.mono && <span className={styles.tileName}>{meta.name}</span>}
    </div>
  );
}

export default function ArticleCard({ article, wide = false }) {
  const meta = sourceMeta(article);
  const [imgFailed, setImgFailed] = useState(false);
  const { ref, glareRef } = useTilt({ max: 7, scale: 1.015 });
  const showImage = Boolean(article.image) && !imgFailed;

  return (
    <li className={[styles.item, wide && styles.wide].filter(Boolean).join(' ')} data-reveal>
      <a
        ref={ref}
        className={styles.card}
        style={sourceVars(meta)}
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${article.title} — read on ${meta.name} (opens in a new tab)`}
      >
        <div className={styles.media}>
          {showImage ? (
            <img
              className={styles.img}
              src={article.image}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <SourceTile meta={meta} />
          )}
          <span className={styles.badge}>{meta.name}</span>
        </div>

        <div className={styles.body}>
          <div className={styles.meta}>
            <span className={styles.time}>
              <Clock size={13} aria-hidden="true" />
              <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
            </span>
            {article.author && (
              <span className={`${styles.author} truncate`}>
                <PenLine size={13} aria-hidden="true" />
                {article.author}
              </span>
            )}
          </div>
          <h3 className={`${styles.title} clamp-2`}>{article.title}</h3>
          {article.summary && <p className={`${styles.summary} clamp-3`}>{article.summary}</p>}
          <span className={styles.cta}>
            Read on {meta.name}
            <ArrowUpRight size={15} aria-hidden="true" />
          </span>
        </div>
        <span ref={glareRef} className={styles.glare} aria-hidden="true" />
      </a>
    </li>
  );
}
