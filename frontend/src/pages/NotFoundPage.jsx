import { Home, CalendarDays } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <section className={`container ${styles.wrap}`}>
      <div>
        <span className={styles.ball} aria-hidden="true">⚽</span>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>That one went over the bar</h1>
        <p className={styles.desc}>The page you’re looking for doesn’t exist or has been moved. Let’s get you back in the game.</p>
        <div className={styles.actions}>
          <Button to="/" variant="gradient"><Home size={16} /> Back home</Button>
          <Button to="/matches" variant="secondary"><CalendarDays size={16} /> Today’s matches</Button>
        </div>
      </div>
    </section>
  );
}
