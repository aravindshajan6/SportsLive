import { useEffect, useRef, useState } from 'react';
import { Clock, ExternalLink, PenLine, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { useTilt } from '@/hooks/useTilt.js';
import { animate, createScope, ensureVisible, prefersReducedMotion, utils } from '@/lib/anim.js';
import { timeAgo } from '@/lib/format.js';
import { SourceTile } from './ArticleCard.jsx';
import { sourceMeta, sourceVars } from './sources.js';
import styles from './NewsHero.module.css';

export function NewsHeroSkeleton() {
  return (
    <div className={`${styles.wrap} ${styles.skeleton}`} aria-hidden="true">
      <div className={styles.card}>
        <Skeleton height="100%" className={styles.skMedia} />
        <div className={styles.skBody}>
          <Skeleton width={110} height={22} />
          <Skeleton width="70%" height={34} />
          <Skeleton width="50%" height={34} />
          <Skeleton width="60%" height={16} />
          <Skeleton width={160} height={42} style={{ borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

export default function NewsHero({ article }) {
  const meta = sourceMeta(article);
  const rootRef = useRef(null);
  const imgRef = useRef(null);
  const [imgFailed, setImgFailed] = useState(false);
  const { ref: tiltRef, glareRef } = useTilt({ max: 5, scale: 1.01 });
  const showImage = Boolean(article?.image) && !imgFailed;

  // Ken-Burns drift on the image + content rise-in. Everything is guarded so the hero
  // is always visible even when animations are unavailable.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !article) return undefined;
    const content = root.querySelectorAll('[data-hero-item]');
    if (prefersReducedMotion()) {
      ensureVisible(content);
      return undefined;
    }
    let scope;
    try {
      scope = createScope({ root }).add(() => {
        if (imgRef.current) {
          animate(imgRef.current, {
            scale: [1.02, 1.14],
            translateX: ['0%', '-2%'],
            translateY: ['0%', '1.5%'],
            duration: 18000,
            ease: 'inOutSine',
            loop: true,
            alternate: true,
          });
        }
        if (content.length) {
          utils.set(content, { opacity: 0, translateY: 18 });
          animate(content, {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 800,
            delay: (_, i) => 120 + i * 90,
            ease: 'outExpo',
          });
        }
      });
    } catch {
      ensureVisible(content);
    }
    return () => {
      scope?.revert();
      ensureVisible(content);
    };
  }, [article]);

  if (!article) return null;

  return (
    <div className={styles.wrap} ref={rootRef}>
      <article ref={tiltRef} className={styles.card} style={sourceVars(meta)}>
        <div className={styles.media} aria-hidden="true">
          {showImage ? (
            <img ref={imgRef} className={styles.img} src={article.image} alt="" decoding="async" onError={() => setImgFailed(true)} />
          ) : (
            <SourceTile meta={meta} className={styles.tile} />
          )}
          <div className={styles.overlay} />
        </div>

        <div className={styles.content}>
          <div className={styles.top} data-hero-item>
            <span className={styles.badge}>
              <Sparkles size={12} aria-hidden="true" /> Top story
            </span>
            <span className={styles.source}>
              <i className={styles.sourceDot} aria-hidden="true" /> {meta.name}
            </span>
          </div>
          <h2 className={styles.title} data-hero-item>
            <a href={article.link} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
              {article.title}
            </a>
          </h2>
          {article.summary && (
            <p className={`${styles.summary} clamp-3`} data-hero-item>
              {article.summary}
            </p>
          )}
          <div className={styles.foot} data-hero-item>
            <span className={styles.meta}>
              <Clock size={14} aria-hidden="true" />
              <time dateTime={article.publishedAt}>{timeAgo(article.publishedAt)}</time>
              {article.author && (
                <>
                  <span className={styles.sep} aria-hidden="true">
                    ·
                  </span>
                  <PenLine size={14} aria-hidden="true" />
                  <span className="truncate">{article.author}</span>
                </>
              )}
            </span>
            <Button href={article.link} target="_blank" rel="noopener noreferrer" variant="gradient" size="md" className={styles.cta}>
              Read on {meta.name} <ExternalLink size={15} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <span ref={glareRef} className={styles.glare} aria-hidden="true" />
      </article>
    </div>
  );
}
