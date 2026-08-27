import { useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import { toISODate } from '@/lib/format.js';
import { pickFeaturedMatch, useMatches } from '@/features/matches/useMatches.js';
import Hero from './Hero.jsx';
import LiveTicker from './LiveTicker.jsx';
import FeaturedMatch from './FeaturedMatch.jsx';
import TodayFixtures from './TodayFixtures.jsx';
import NewsTeaser from './NewsTeaser.jsx';
import styles from './HomePage.module.css';

export default function HomePage() {
  useDocumentTitle(null);
  const today = toISODate();
  const { matches, groups, loading, error, refetch, counts } = useMatches(today);
  const featured = useMemo(() => pickFeaturedMatch(matches), [matches]);

  return (
    <div className={styles.page}>
      <Hero featured={featured} loading={loading} liveCount={counts.live} />
      <LiveTicker matches={matches} loading={loading} />
      <div className={styles.body}>
        <FeaturedMatch featured={featured} loading={loading} />
        <TodayFixtures groups={groups} loading={loading} error={error} onRetry={refetch} />
        <NewsTeaser />
      </div>
    </div>
  );
}
