import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquareText, Trophy } from 'lucide-react';
import { timeAgo } from '@/lib/format.js';
import Skeleton, { SkeletonLines } from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import Button from '@/components/ui/Button.jsx';
import styles from './ProfilePage.module.css';

export default function MyComments({ query }) {
  const { data, error, loading, refetch } = query;
  const comments = data?.comments ?? [];

  if (loading) {
    return (
      <ul className={styles.commentList} aria-busy="true" aria-label="Loading comments">
        {[0, 1, 2].map((i) => (
          <li key={i} className={styles.comment}>
            <Skeleton width={90} height={12} />
            <SkeletonLines lines={2} widths={['96%', '64%']} />
          </li>
        ))}
      </ul>
    );
  }
  if (error) return <ErrorState title="Couldn't load your comments" error={error} onRetry={refetch} />;
  if (!comments.length) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="You haven't commented yet"
        description="Pick a match and join the conversation in the Comments tab."
      >
        <Button variant="secondary" size="sm" to="/matches">
          <Trophy size={14} /> Browse matches
        </Button>
      </EmptyState>
    );
  }
  return (
    <ul className={styles.commentList}>
      {comments.map((c) => (
        <li key={c.id} className={styles.comment}>
          <div className={styles.commentMeta}>
            <span className={styles.commentMatch}>Match #{c.matchId}</span>
            <time dateTime={c.createdAt} className={styles.commentTime}>
              {timeAgo(c.createdAt)}
            </time>
          </div>
          <p className={styles.commentText}>{c.text}</p>
          <Link to={`/match/${c.matchId}?tab=comments`} className={styles.commentLink}>
            View match <ArrowRight size={14} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
