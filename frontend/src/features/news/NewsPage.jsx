import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper, RefreshCw, Search, SearchX, X } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import { useFetch } from '@/hooks/useFetch.js';
import { useReveal } from '@/hooks/useReveal.js';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import { newsApi } from '@/lib/api.js';
import { timeAgo, pluralize } from '@/lib/format.js';
import NewsHero, { NewsHeroSkeleton } from './NewsHero.jsx';
import ArticleCard from './ArticleCard.jsx';
import SourceFilter from './SourceFilter.jsx';
import { SOURCES, SOURCE_ORDER } from './sources.js';
import styles from './NewsPage.module.css';

const VALID_SOURCES = new Set(['all', ...SOURCE_ORDER]);

function ArticleSkeleton() {
  return (
    <li className={styles.skCard} aria-hidden="true">
      <Skeleton height="auto" className={styles.skMedia} />
      <div className={styles.skBody}>
        <Skeleton width={90} height={12} />
        <Skeleton width="92%" height={18} />
        <Skeleton width="70%" height={18} />
        <Skeleton width="100%" height={12} />
        <Skeleton width="85%" height={12} />
      </div>
    </li>
  );
}

/** "just now" for the first 45s, then the shared timeAgo() label (re-evaluated as `now` ticks). */
function updatedAgo(at, now) {
  return now - at < 45000 ? 'just now' : timeAgo(at);
}

/** Ticks every 30s so "Updated X ago" stays fresh. */
function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function NewsPage() {
  useDocumentTitle('Football news');
  const [params, setParams] = useSearchParams();
  const rawSource = params.get('source') ?? 'all';
  const source = VALID_SOURCES.has(rawSource) ? rawSource : 'all';
  const [query, setQuery] = useState('');
  const now = useNow();

  const { data, error, loading, refreshing, refetch, updatedAt } = useFetch((signal) => newsApi.list('all', 40, signal), {
    deps: [],
  });

  const articles = useMemo(() => data?.articles ?? [], [data]);

  const counts = useMemo(() => {
    const c = { all: articles.length };
    SOURCE_ORDER.forEach((k) => {
      c[k] = 0;
    });
    articles.forEach((a) => {
      if (a.sourceKey in c) c[a.sourceKey] += 1;
    });
    return c;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (source !== 'all' && a.sourceKey !== source) return false;
      if (!q) return true;
      return a.title?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q);
    });
  }, [articles, source, query]);

  // Newest article that has an image becomes the hero (only when not searching).
  const hero = useMemo(() => (query.trim() ? null : filtered.find((a) => a.image) ?? null), [filtered, query]);
  const gridItems = useMemo(() => (hero ? filtered.filter((a) => a.id !== hero.id) : filtered), [filtered, hero]);

  const revealKey = gridItems.map((a) => a.id).join('|');
  const gridRef = useReveal([revealKey], { step: 60 });

  const setSource = (key) => {
    const next = new URLSearchParams(params);
    if (key === 'all') next.delete('source');
    else next.set('source', key);
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setQuery('');
    setSource('all');
  };

  const activeName = source === 'all' ? null : SOURCES[source]?.name;
  const updatedLabel = updatedAt ? updatedAgo(updatedAt, now) : null;

  return (
    <section className={`container section ${styles.page}`}>
      <SectionHeading
        eyebrow="Football news"
        title="Latest headlines"
        as="h1"
        description="Fresh football stories aggregated from BBC Sport, The Guardian, ESPN and Sky Sports — updated every few minutes."
      >
        <div className={styles.status}>
          {updatedLabel && (
            <span className={styles.updated} aria-live="polite">
              <span className={styles.updatedDot} aria-hidden="true" />
              Updated {updatedLabel}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={refetch} loading={refreshing} disabled={loading} aria-label="Refresh news">
            {!refreshing && <RefreshCw size={14} aria-hidden="true" />} Refresh
          </Button>
        </div>
      </SectionHeading>

      <div className={styles.toolbar}>
        <SourceFilter value={source} onChange={setSource} counts={articles.length ? counts : {}} disabled={loading} />
        <Input
          className={styles.search}
          type="text"
          icon={Search}
          placeholder="Search headlines…"
          aria-label="Search headlines"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          suffix={
            query ? (
              <button type="button" className={styles.clearBtn} onClick={() => setQuery('')} aria-label="Clear search">
                <X size={16} />
              </button>
            ) : null
          }
        />
      </div>

      {loading ? (
        <>
          <NewsHeroSkeleton />
          <ul className={styles.grid} aria-busy="true" aria-label="Loading articles">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </ul>
        </>
      ) : error && !articles.length ? (
        <ErrorState title="Couldn't load the news" error={error} onRetry={refetch} />
      ) : !filtered.length ? (
        <EmptyState
          icon={query ? SearchX : Newspaper}
          title={query ? `No results for “${query.trim()}”` : `No ${activeName ?? ''} stories right now`}
          description={
            query
              ? 'Try a different keyword or clear the search to see all headlines.'
              : 'That feed may be temporarily unavailable. Try another source or refresh in a moment.'
          }
        >
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
          <Button variant="ghost" size="sm" onClick={refetch} loading={refreshing}>
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </Button>
        </EmptyState>
      ) : (
        <>
          {error && (
            <p className={styles.staleNote} role="status">
              Showing the last loaded headlines — {error.message}
            </p>
          )}
          {hero && <NewsHero article={hero} />}
          <div className={styles.gridHead}>
            <h2 className={styles.gridTitle}>{activeName ? `More from ${activeName}` : 'More stories'}</h2>
            <span className={styles.count}>{pluralize(filtered.length, 'article')}</span>
          </div>
          <ul ref={gridRef} className={styles.grid} aria-label="Articles">
            {gridItems.map((article, i) => (
              <ArticleCard key={article.id} article={article} wide={i % 7 === 3} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
