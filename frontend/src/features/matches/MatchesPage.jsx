import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX2, Flame, RefreshCw, Search, SearchX, Trophy, X } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import Input from '@/components/ui/Input.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import { useReveal } from '@/hooks/useReveal.js';
import { pluralize, toISODate } from '@/lib/format.js';
import CompetitionGroup from './CompetitionGroup.jsx';
import DateTabs from './DateTabs.jsx';
import { dateLabel } from './dateLabels.js';
import { filterMatches, groupMatches, useMatches } from './useMatches.js';
import styles from './MatchesPage.module.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'finished', label: 'Finished' },
];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function UpdatedAgo({ at, refreshing, onRefresh }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);
  const secs = at ? Math.max(0, Math.round((now - at) / 1000)) : null;
  const label = secs === null ? 'Not updated yet' : secs < 10 ? 'Updated just now' : secs < 60 ? `Updated ${secs}s ago` : `Updated ${Math.round(secs / 60)}m ago`;
  return (
    <div className={styles.updated}>
      <span aria-live="polite">{label}</span>
      <button
        type="button"
        className={[styles.refresh, refreshing && styles.spinning].filter(Boolean).join(' ')}
        onClick={onRefresh}
        aria-label="Refresh matches"
        title="Refresh"
        disabled={refreshing}
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className={styles.skeletons} aria-hidden="true">
      {[0, 1, 2].map((g) => (
        <div key={g} className={styles.skGroup}>
          <div className={styles.skHead}>
            <Skeleton width={28} height={28} circle />
            <Skeleton width="38%" height={14} />
          </div>
          {[0, 1, 2].map((r) => (
            <div key={r} className={styles.skRow}>
              <Skeleton width={52} height={22} />
              <Skeleton width="30%" height={14} />
              <Skeleton width={60} height={26} />
              <Skeleton width="30%" height={14} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MatchesPage() {
  const [params, setParams] = useSearchParams();
  const today = toISODate();
  const rawDate = params.get('date');
  const date = rawDate && ISO_RE.test(rawDate) && !Number.isNaN(Date.parse(rawDate)) ? rawDate : today;
  const rawFilter = params.get('filter');
  const filter = FILTERS.some((f) => f.key === rawFilter) ? rawFilter : 'all';
  const [query, setQuery] = useState('');

  const { matches, counts, loading, error, liveError, refreshing, refetch, updatedAt, isToday } = useMatches(date);
  const label = dateLabel(date);
  useDocumentTitle(isToday ? "Today's matches" : `Matches · ${label}`);

  const setParam = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  const setDate = useCallback((iso) => setParam('date', iso === today ? '' : iso), [setParam, today]);
  const setFilter = useCallback((key) => setParam('filter', key === 'all' ? '' : key), [setParam]);

  const filtered = useMemo(() => filterMatches(matches, { filter, query }), [matches, filter, query]);
  const groups = useMemo(() => groupMatches(filtered), [filtered]);
  const revealRef = useReveal([groups], { step: 40, distance: 16 });

  const hasData = matches.length > 0;
  const summary = hasData
    ? `${pluralize(counts.all, 'match', 'matches')}${counts.live ? ` · ${counts.live} live` : ''}`
    : loading
      ? 'Loading fixtures…'
      : 'No matches';

  const renderEmpty = () => {
    if (query.trim()) {
      return (
        <EmptyState icon={SearchX} title={`No matches for “${query.trim()}”`} description="Try a team, an abbreviation or a competition name.">
          <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
            Clear search
          </Button>
        </EmptyState>
      );
    }
    if (filter === 'live') {
      return (
        <EmptyState
          icon={Flame}
          title="No live matches right now"
          description={hasData ? `Here's what else is happening ${isToday ? 'today' : `on ${label}`}.` : 'Check back a little later — live scores refresh every minute.'}
        >
          <Button variant="primary" size="sm" onClick={() => setFilter('all')}>
            Show all matches
          </Button>
        </EmptyState>
      );
    }
    if (filter === 'upcoming') {
      return (
        <EmptyState icon={CalendarX2} title="No upcoming matches" description="Everything scheduled for this day has already kicked off or finished.">
          <Button variant="primary" size="sm" onClick={() => setFilter('all')}>
            Show all matches
          </Button>
        </EmptyState>
      );
    }
    if (filter === 'finished') {
      return (
        <EmptyState icon={Trophy} title="No results yet" description="Full-time scores will appear here as matches finish.">
          <Button variant="primary" size="sm" onClick={() => setFilter('all')}>
            Show all matches
          </Button>
        </EmptyState>
      );
    }
    return (
      <EmptyState icon={CalendarX2} title="No fixtures on this day" description="Try another day, or jump back to today's schedule.">
        {!isToday && (
          <Button variant="primary" size="sm" onClick={() => setDate(today)}>
            Go to today
          </Button>
        )}
      </EmptyState>
    );
  };

  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <div className={styles.headRow}>
            <div>
              <span className={styles.eyebrow}>Fixtures &amp; results</span>
              <h1 className={styles.title}>
                Matches <span className={styles.titleDate}>· {label}</span>
              </h1>
              <p className={styles.summary}>{summary}</p>
            </div>
            <UpdatedAgo at={updatedAt} refreshing={refreshing} onRefresh={refetch} />
          </div>
        </div>
      </section>

      <div className={styles.sub}>
        <div className={`container ${styles.subInner}`}>
          <DateTabs value={date} onChange={setDate} />
          <div className={styles.tools}>
            <div className={styles.filters} role="group" aria-label="Filter matches">
              {FILTERS.map((f) => {
                const count = counts[f.key];
                const active = f.key === filter;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={[styles.filter, active && styles.filterActive, f.key === 'live' && styles.filterLive].filter(Boolean).join(' ')}
                    aria-pressed={active}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.key === 'live' && <span className={styles.liveDot} aria-hidden="true" />}
                    {f.label}
                    {f.key !== 'all' && hasData && <span className={styles.filterCount}>{count}</span>}
                  </button>
                );
              })}
            </div>
            <Input
              type="search"
              icon={Search}
              placeholder="Search team or competition"
              aria-label="Search team or competition"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.search}
              suffix={
                query ? (
                  <button type="button" className={styles.clear} onClick={() => setQuery('')} aria-label="Clear search">
                    <X size={14} />
                  </button>
                ) : null
              }
            />
          </div>
        </div>
      </div>

      <section className={`container ${styles.content}`} ref={revealRef}>
        {error && hasData && (
          <div className={styles.banner} role="status">
            <span>Couldn’t refresh fixtures: {error.message}</span>
            <Button variant="ghost" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        )}
        {!error && liveError && isToday && hasData && (
          <div className={styles.banner} role="status">
            <span>Live scores are temporarily unavailable — showing the latest fixtures list.</span>
          </div>
        )}

        {loading ? (
          <SkeletonList />
        ) : error && !hasData ? (
          <ErrorState title="Couldn’t load fixtures" error={error} onRetry={refetch} />
        ) : groups.length === 0 ? (
          renderEmpty()
        ) : (
          <div className={styles.groups}>
            {groups.map((g) => (
              <CompetitionGroup key={g.id} group={g} data-reveal />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
