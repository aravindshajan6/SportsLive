import { ArrowRight, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import SectionHeading from '@/components/ui/SectionHeading.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { useFetch } from '@/hooks/useFetch.js';
import { useReveal } from '@/hooks/useReveal.js';
import { newsApi } from '@/lib/api.js';
import { timeAgo } from '@/lib/format.js';
import styles from './NewsTeaser.module.css';

const SOURCE_GRADIENTS = {
  bbc: 'linear-gradient(135deg, #b80000, #ff4d4d)',
  guardian: 'linear-gradient(135deg, #052962, #2f6fd3)',
  espn: 'linear-gradient(135deg, #7a1500, #d63a1a)',
  sky: 'linear-gradient(135deg, #0a1f5c, #0ea5e9)',
};

function ArticleCard({ article }) {
  const gradient = SOURCE_GRADIENTS[article.sourceKey] || 'var(--brand-grad)';
  return (
    <a
      className={styles.card}
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      data-reveal
      aria-label={`${article.title} (${article.source}, opens in a new tab)`}
    >
      <span className={styles.media} style={{ background: gradient }}>
        {article.image ? (
          <img src={article.image} alt="" loading="lazy" decoding="async" className={styles.img} />
        ) : (
          <span className={styles.fallback}>{article.source}</span>
        )}
        <span className={styles.source}>{article.source}</span>
      </span>
      <span className={styles.body}>
        <span className={`${styles.title} clamp-2`}>{article.title}</span>
        {article.summary && <span className={`${styles.summary} clamp-2`}>{article.summary}</span>}
        <span className={styles.meta}>
          <span>{timeAgo(article.publishedAt)}</span>
          <ExternalLink size={13} aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

export default function NewsTeaser() {
  const { data, error, loading } = useFetch((signal) => newsApi.list('all', 12, signal), { deps: ['news-teaser'] });
  // Prefer stories that have an image (ESPN's feed has none) and mix sources, keeping newest first.
  const articles = (() => {
    const all = data?.articles || [];
    const withImage = all.filter((a) => a.image);
    const pool = withImage.length >= 3 ? withImage : all;
    const picked = [];
    const seenSources = new Set();
    for (const a of pool) {
      if (picked.length === 3) break;
      if (!seenSources.has(a.sourceKey)) {
        picked.push(a);
        seenSources.add(a.sourceKey);
      }
    }
    for (const a of pool) {
      if (picked.length === 3) break;
      if (!picked.includes(a)) picked.push(a);
    }
    return picked;
  })();
  const ref = useReveal([articles.length]);

  // News is a bonus on the home page: fail quietly.
  if (error && !articles.length) return null;
  if (!loading && !articles.length) return null;

  return (
    <section className="container" ref={ref} aria-labelledby="news-title">
      <SectionHeading eyebrow="Headlines" title="Latest football news" description="From BBC Sport, The Guardian, ESPN and Sky Sports.">
        <Button to="/news" variant="outline" size="sm">
          All news <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </SectionHeading>
      <div className={styles.grid}>
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className={styles.skCard} aria-hidden="true">
                <Skeleton height={170} style={{ borderRadius: 0 }} />
                <div className={styles.skBody}>
                  <Skeleton width="90%" height={14} />
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="40%" height={10} />
                </div>
              </div>
            ))
          : articles.map((a) => <ArticleCard key={a.id} article={a} />)}
      </div>
    </section>
  );
}
