import { useEffect, useRef, useState } from 'react';
import { LogIn, MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext.jsx';
import { matchesApi } from '@/lib/api.js';
import { timeAgo } from '@/lib/format.js';
import Avatar from '@/components/ui/Avatar.jsx';
import Button from '@/components/ui/Button.jsx';
import Card from '@/components/ui/Card.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import ErrorState from '@/components/ui/ErrorState.jsx';
import Skeleton from '@/components/ui/Skeleton.jsx';
import { TextArea } from '@/components/ui/Input.jsx';
import { animate, ensureVisible, prefersReducedMotion, stagger } from '@/lib/anim.js';
import styles from './CommentsSection.module.css';

const MAX = 500;

function Composer({ matchId, onAdd }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const remaining = MAX - text.length;
  const canPost = text.trim().length > 0 && !posting;

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    const temp = {
      id: `temp-${Date.now()}`,
      matchId,
      username: user?.username || 'you',
      text: body,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    onAdd((list) => [temp, ...list]);
    try {
      const res = await matchesApi.addComment(matchId, body);
      const saved = res?.comment || { ...temp, pending: false };
      onAdd((list) => list.map((c) => (c.id === temp.id ? saved : c)));
      setText('');
      toast.success('Comment posted');
    } catch (err) {
      onAdd((list) => list.filter((c) => c.id !== temp.id));
      toast.error(err?.message || 'Could not post your comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card as="form" className={styles.composer} onSubmit={submit}>
      <div className={styles.composerHead}>
        <Avatar name={user?.username || '?'} size={36} />
        <span className={styles.composerName}>{user?.username}</span>
      </div>
      <TextArea
        aria-label="Write a comment"
        placeholder="Share your thoughts on this match…"
        value={text}
        maxLength={MAX}
        rows={3}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e);
        }}
        disabled={posting}
      />
      <div className={styles.composerFoot}>
        <span className={[styles.counter, remaining <= 50 && styles.counterWarn].filter(Boolean).join(' ')} aria-live="polite">
          {text.length}/{MAX}
        </span>
        <Button type="submit" variant="gradient" size="sm" loading={posting} disabled={!canPost}>
          <Send size={14} /> Post
        </Button>
      </div>
    </Card>
  );
}

function SignInCard({ matchId }) {
  const next = encodeURIComponent(`/match/${matchId}?tab=comments`);
  return (
    <Card className={styles.signin}>
      <span className={styles.signinIcon}>
        <MessageSquare size={22} />
      </span>
      <div className={styles.signinText}>
        <h3 className={styles.signinTitle}>Sign in to join the conversation</h3>
        <p className={styles.signinDesc}>Share your take on the match with other fans.</p>
      </div>
      <Button to={`/login?next=${next}`} variant="primary" size="sm">
        <LogIn size={15} /> Login
      </Button>
    </Card>
  );
}

/**
 * Props: matchId, query = useFetch result for matchesApi.comments (data: { comments }).
 */
export default function CommentsSection({ matchId, query }) {
  const { isAuthenticated } = useAuth();
  const listRef = useRef(null);
  const comments = query.data?.comments || [];
  const count = comments.length;
  const firstId = comments[0]?.id;

  const onAdd = (updater) => {
    query.setData((prev) => ({ ...(prev || {}), comments: updater(prev?.comments || []) }));
  };

  useEffect(() => {
    const root = listRef.current;
    if (!root) return undefined;
    const items = Array.from(root.querySelectorAll('[data-c]:not([data-shown])'));
    if (!items.length) return undefined;
    items.forEach((el) => el.setAttribute('data-shown', '1'));
    if (prefersReducedMotion()) return undefined;
    let anim;
    try {
      anim = animate(items, { opacity: [0, 1], y: [10, 0], duration: 550, ease: 'outExpo', delay: stagger(40) });
    } catch {
      ensureVisible(items);
    }
    const safety = setTimeout(() => ensureVisible(items), 2500);
    return () => {
      clearTimeout(safety);
      anim?.pause();
      ensureVisible(items);
    };
  }, [count, firstId]);

  let body;
  if (query.loading) {
    body = (
      <div className={styles.list} aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.item}>
            <Skeleton circle width={36} height={36} />
            <div style={{ flex: 1 }}>
              <Skeleton text width="30%" />
              <Skeleton text width="90%" />
              <Skeleton text width="60%" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (query.error && !query.data) {
    body = <ErrorState title="Couldn't load comments" error={query.error} onRetry={query.refetch} />;
  } else if (!count) {
    body = <EmptyState icon={MessageSquare} title="Be the first to comment" description="No one has said anything about this match yet." />;
  } else {
    body = (
      <ol ref={listRef} className={styles.list} aria-label="Comments">
        {comments.map((c) => (
          <li key={c.id} className={[styles.item, c.pending && styles.pending].filter(Boolean).join(' ')} data-c>
            <Avatar name={c.username} size={36} />
            <div className={styles.itemBody}>
              <div className={styles.itemHead}>
                <span className={styles.user}>{c.username}</span>
                <span className={styles.time}>{c.pending ? 'Posting…' : timeAgo(c.createdAt)}</span>
              </div>
              <p className={styles.text}>{c.text}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className={styles.wrap}>
      {isAuthenticated ? <Composer matchId={matchId} onAdd={onAdd} /> : <SignInCard matchId={matchId} />}
      <div className={styles.listHead}>
        <span>{count ? `${count} comment${count === 1 ? '' : 's'}` : 'Comments'}</span>
      </div>
      {body}
    </div>
  );
}
