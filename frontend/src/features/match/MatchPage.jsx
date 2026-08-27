import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChartNoAxesColumn, ListOrdered, MessageSquare, Shirt, Swords, Activity, Users } from 'lucide-react';
import { matchesApi } from '@/lib/api.js';
import { useFetch } from '@/hooks/useFetch.js';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import Tabs from '@/components/ui/Tabs.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import Button from '@/components/ui/Button.jsx';
import ScoreHeader from './ScoreHeader.jsx';
import IncidentsTimeline from './IncidentsTimeline.jsx';
import StatsBars from './StatsBars.jsx';
import LineupsPitch from './LineupsPitch.jsx';
import H2HList from './H2HList.jsx';
import CommentsSection from './CommentsSection.jsx';
import styles from './MatchPage.module.css';

const TABS = [
  { key: 'summary', label: 'Summary', icon: ListOrdered },
  { key: 'stats', label: 'Stats', icon: ChartNoAxesColumn },
  { key: 'lineups', label: 'Lineups', icon: Shirt },
  { key: 'h2h', label: 'H2H', icon: Swords },
  { key: 'comments', label: 'Comments', icon: MessageSquare },
];
const TAB_KEYS = TABS.map((t) => t.key);

/** Once `flag` has been true it stays true (lazy tabs keep their data enabled/cached). */
function useSticky(flag) {
  const [seen, setSeen] = useState(flag);
  if (flag && !seen) setSeen(true);
  return seen || flag;
}

function PanelSkeleton({ rows = 6 }) {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skRow}>
          <Skeleton circle width={34} height={34} />
          <div className={styles.skLines}>
            <Skeleton text width={`${55 + ((i * 17) % 40)}%`} />
            <Skeleton text width={`${30 + ((i * 23) % 35)}%`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Loading / error / empty wrapper for a lazy tab. */
function Panel({ query, isEmpty, empty, children }) {
  if (query.loading) return <PanelSkeleton />;
  if (query.error && !query.data) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (!query.data || (isEmpty && isEmpty(query.data))) return empty;
  return children(query.data);
}

function HeaderSkeleton() {
  return (
    <div className={styles.headerSkeleton} aria-busy="true" aria-label="Loading match">
      <div className={styles.skTop}>
        <Skeleton width={90} height={20} />
        <Skeleton width={180} height={14} />
      </div>
      <Skeleton width={220} height={14} style={{ margin: '18px auto' }} />
      <div className={styles.skMain}>
        <div className={styles.skTeam}>
          <Skeleton circle width={72} height={72} />
          <Skeleton width={110} height={16} />
        </div>
        <Skeleton width={150} height={70} />
        <div className={styles.skTeam}>
          <Skeleton circle width={72} height={72} />
          <Skeleton width={110} height={16} />
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = TAB_KEYS.includes(rawTab) ? rawTab : 'summary';

  const setTab = useCallback(
    (key) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (key === 'summary') next.delete('tab');
          else next.set('tab', key);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Poll the scoreboard while the match is live. `isLive` mirrors the last response (derived state).
  const [isLive, setIsLive] = useState(false);
  const detail = useFetch((signal) => matchesApi.detail(id, signal), { deps: [id], pollMs: isLive ? 60000 : 0 });
  const match = detail.data;
  const nextLive = Boolean(match?.isLive);
  if (nextLive !== isLive) setIsLive(nextLive);

  useDocumentTitle(match ? `${match.home.name} v ${match.away.name}` : 'Match');

  const isUpcoming = match?.phase === 'upcoming';
  const ready = Boolean(match);

  // Lazy per-tab data. Each becomes enabled the first time its tab is opened and stays cached.
  const wantSummary = useSticky(ready && tab === 'summary' && !isUpcoming);
  const wantStats = useSticky(ready && tab === 'stats');
  const wantLineups = useSticky(ready && tab === 'lineups');
  const wantH2h = useSticky(ready && tab === 'h2h');
  const wantComments = useSticky(ready && tab === 'comments');

  const incidents = useFetch((signal) => matchesApi.incidents(id, signal), {
    deps: [id],
    enabled: wantSummary,
    pollMs: isLive && tab === 'summary' ? 60000 : 0,
  });
  const stats = useFetch((signal) => matchesApi.statistics(id, signal), {
    deps: [id],
    enabled: wantStats,
    pollMs: isLive && tab === 'stats' ? 60000 : 0,
  });
  const lineups = useFetch((signal) => matchesApi.lineups(id, signal), { deps: [id], enabled: wantLineups });
  const h2h = useFetch((signal) => matchesApi.h2h(id, signal), { deps: [id], enabled: wantH2h });
  const comments = useFetch((signal) => matchesApi.comments(id, signal), { deps: [id], enabled: wantComments });

  if (detail.loading) {
    return (
      <section className={`container ${styles.page}`}>
        <HeaderSkeleton />
        <div className={styles.tabsWrap}>
          <Skeleton width="100%" height={44} style={{ borderRadius: 999 }} />
        </div>
        <PanelSkeleton />
      </section>
    );
  }

  if (detail.error && !match) {
    const notFound = detail.error.status === 404;
    return (
      <section className={`container ${styles.page}`}>
        <ErrorState
          title={notFound ? 'Match not found' : "Couldn't load this match"}
          error={notFound ? `We couldn't find a match with id ${id}.` : detail.error}
          onRetry={notFound ? undefined : detail.refetch}
        />
        <div className={styles.errorActions}>
          <Button to="/matches" variant="secondary">
            <ArrowLeft size={16} /> Back to matches
          </Button>
        </div>
      </section>
    );
  }

  if (!match) return null;

  return (
    <section className={`container ${styles.page}`}>
      <ScoreHeader key={match.id} match={match} />

      <div className={styles.tabsWrap}>
        <Tabs items={TABS} value={tab} onChange={setTab} ariaLabel="Match sections" stretch />
      </div>

      <div className={styles.panel} role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label} key={tab}>
        {tab === 'summary' &&
          (isUpcoming ? (
            <IncidentsTimeline incidents={null} match={match} />
          ) : (
            <Panel
              query={incidents}
              isEmpty={(d) => !(d.periods || []).some((p) => p.events?.length)}
              empty={
                <EmptyState
                  icon={Activity}
                  title="No key events yet"
                  description={match.isLive ? 'Goals, cards and substitutions will appear here as they happen.' : 'No incidents were recorded for this match.'}
                />
              }
            >
              {(data) => <IncidentsTimeline incidents={data} match={match} />}
            </Panel>
          ))}

        {tab === 'stats' && (
          <Panel
            query={stats}
            isEmpty={(d) => !(d.rows || []).length}
            empty={
              <EmptyState
                icon={ChartNoAxesColumn}
                title="No statistics yet"
                description={isUpcoming ? 'Stats will appear once the match kicks off.' : 'Statistics are not available for this match.'}
              />
            }
          >
            {(data) => <StatsBars stats={data} match={match} />}
          </Panel>
        )}

        {tab === 'lineups' && (
          <Panel query={lineups} empty={<EmptyState icon={Users} title="Lineups not announced yet" description="Starting XIs are usually published around an hour before kick-off." />}>
            {(data) => <LineupsPitch lineups={data} match={match} />}
          </Panel>
        )}

        {tab === 'h2h' && (
          <Panel
            query={h2h}
            isEmpty={(d) => !(d.matches || []).length}
            empty={<EmptyState icon={Swords} title="No previous meetings" description="These two sides haven't met recently." />}
          >
            {(data) => <H2HList h2h={data} match={match} />}
          </Panel>
        )}

        {tab === 'comments' && <CommentsSection matchId={id} query={comments} />}
      </div>

      <p className={styles.footNote}>
        <Link to="/matches" className={styles.footLink}>
          <ArrowLeft size={14} /> All matches
        </Link>
        {detail.updatedAt && isLive && <span>Live · auto-refreshing every minute</span>}
      </p>
    </section>
  );
}
