import { startTransition, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, LogOut, Mail, MessageSquareText, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext.jsx';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import { formatDate } from '@/lib/format.js';
import { animate, createScope, prefersReducedMotion, stagger, utils } from '@/lib/anim.js';
import Avatar from '@/components/ui/Avatar.jsx';
import Button from '@/components/ui/Button.jsx';
import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import EditProfileForm from './EditProfileForm.jsx';
import MyComments from './MyComments.jsx';
import { authApi } from '@/lib/api.js';
import { useFetch } from '@/hooks/useFetch.js';
import styles from './ProfilePage.module.css';

/** /profile — rendered inside <ProtectedRoute>, so `user` is always present. */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { hash } = useLocation();
  useDocumentTitle(user ? `${user.username} · Profile` : 'Profile');

  const rootRef = useRef(null);
  const commentsRef = useRef(null);
  const comments = useFetch((signal) => authApi.myComments(signal), { deps: [user?.id] });
  const commentCount = comments.data?.comments?.length ?? null;

  // entrance: cards rise in with a stagger
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cards = root.querySelectorAll('[data-card]');
    if (prefersReducedMotion()) {
      utils.set(cards, { opacity: 1, y: 0 });
      return undefined;
    }
    const scope = createScope({ root }).add(() => {
      animate('[data-card]', {
        opacity: [0, 1],
        y: [26, 0],
        scale: [0.985, 1],
        duration: 850,
        delay: stagger(110, { start: 60 }),
        ease: 'outExpo',
      });
    });
    return () => {
      scope.revert();
      utils.set(cards, { opacity: 1, y: 0, scale: 1 });
    };
  }, []);

  // deep link: /profile#comments
  useEffect(() => {
    if (hash !== '#comments') return undefined;
    const id = setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(id);
  }, [hash]);

  const onLogout = () => {
    toast.success('Signed out. See you soon!');
    // react-router wraps navigate() in startTransition; batch the auth state change into the same
    // transition so ProtectedRoute never renders "no user" while still on /profile.
    startTransition(() => {
      logout();
      navigate('/');
    });
  };

  if (!user) return null;

  return (
    <section className={`container ${styles.page}`} ref={rootRef}>
      <Card data-card className={styles.header} padded={false}>
        <div className={styles.headerBg} aria-hidden="true" />
        <div className={styles.headerInner}>
          <span className={styles.ring}>
            <Avatar name={user.username} size={72} className={styles.avatar} />
          </span>
          <div className={styles.identity}>
            <h1 className={styles.username}>{user.username}</h1>
            <div className={styles.metaRow}>
              <span className={styles.meta}>
                <Mail size={14} /> {user.email}
              </span>
              <span className={styles.meta}>
                <CalendarDays size={14} /> Member since {formatDate(user.createdAt)}
              </span>
              {commentCount !== null && (
                <Badge variant="accent">
                  <MessageSquareText size={12} /> {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="danger" onClick={onLogout} className={styles.signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </Card>

      <div className={styles.grid}>
        <Card data-card as="section" aria-labelledby="edit-profile-title" className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelIcon}>
              <Pencil size={18} />
            </span>
            <div>
              <h2 id="edit-profile-title" className={styles.panelTitle}>Edit profile</h2>
              <p className={styles.panelDesc}>Update your details or change your password.</p>
            </div>
          </div>
          <EditProfileForm key={user.id} />
        </Card>

        <Card data-card as="section" id="comments" ref={commentsRef} aria-labelledby="my-comments-title" className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelIcon}>
              <MessageSquareText size={18} />
            </span>
            <div>
              <h2 id="my-comments-title" className={styles.panelTitle}>My comments</h2>
              <p className={styles.panelDesc}>Everything you've said in the stands.</p>
            </div>
          </div>
          <MyComments query={comments} />
        </Card>
      </div>
    </section>
  );
}
