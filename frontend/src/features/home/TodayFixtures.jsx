import { ArrowRight, CalendarX2 } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import SectionHeading from '@/components/ui/SectionHeading.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { useReveal } from '@/hooks/useReveal.js';
import CompetitionGroup from '@/features/matches/CompetitionGroup.jsx';
import styles from './TodayFixtures.module.css';

const MAX_GROUPS = 4;
const MAX_PER_GROUP = 5;

function SkeletonGroups() {
  return (
    <div className={styles.grid} aria-hidden="true">
      {[0, 1, 2, 3].map((g) => (
        <div key={g} className={styles.skGroup}>
          <div className={styles.skHead}>
            <Skeleton width={28} height={28} circle />
            <Skeleton width="45%" height={14} />
          </div>
          {[0, 1, 2].map((r) => (
            <div key={r} className={styles.skRow}>
              <Skeleton width={46} height={20} />
              <Skeleton width="28%" height={12} />
              <Skeleton width={54} height={24} />
              <Skeleton width="28%" height={12} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TodayFixtures({ groups = [], loading, error, onRetry }) {
  const shown = groups.slice(0, MAX_GROUPS);
  const ref = useReveal([shown.length, loading]);
  const total = groups.reduce((n, g) => n + g.matches.length, 0);

  return (
    <section className="container" ref={ref} aria-labelledby="fixtures-title">
      <SectionHeading
        eyebrow="Fixtures"
        title="Today's matches"
        description={total ? `${total} matches across ${groups.length} competitions` : 'Live scores, kick-off times and results.'}
      >
        <Button to="/matches" variant="outline" size="sm">
          See all fixtures <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </SectionHeading>

      {loading ? (
        <SkeletonGroups />
      ) : error && !groups.length ? (
        <ErrorState title="Couldn’t load today’s fixtures" error={error} onRetry={onRetry} />
      ) : !groups.length ? (
        <EmptyState icon={CalendarX2} title="No fixtures today" description="Nothing is scheduled for today. Browse other days on the matches page.">
          <Button to="/matches" variant="primary" size="sm">
            Open the calendar
          </Button>
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {shown.map((g) => (
            <CompetitionGroup key={g.id} group={g} limit={MAX_PER_GROUP} moreTo="/matches" compact data-reveal />
          ))}
        </div>
      )}
    </section>
  );
}
