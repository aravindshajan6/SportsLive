import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo.jsx';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div>
            <BrandLogo height={44} />
            <p className={styles.tagline}>
              Live football scores, fixtures, lineups, match stats and the latest news — one stop for every football enthusiast.
            </p>
            <div className={styles.social}>
              <a href="https://github.com/aravindshajan6" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
              </a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>
              </a>
              <a href="mailto:aravindshajan6@gmail.com" aria-label="Email">
                <Mail size={17} />
              </a>
            </div>
          </div>
          <div>
            <h4 className={styles.colTitle}>Explore</h4>
            <ul className={styles.list}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/matches">Live &amp; fixtures</Link></li>
              <li><Link to="/news">Football news</Link></li>
              <li><Link to="/about">About &amp; contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.colTitle}>Account</h4>
            <ul className={styles.list}>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Create account</Link></li>
              <li><Link to="/profile">My profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.colTitle}>Data sources</h4>
            <ul className={styles.list}>
              <li><a href="https://www.livescore.com" target="_blank" rel="noopener noreferrer">Scores &amp; stats · LiveScore</a></li>
              <li><a href="https://www.bbc.com/sport/football" target="_blank" rel="noopener noreferrer">News · BBC Sport</a></li>
              <li><a href="https://www.theguardian.com/football" target="_blank" rel="noopener noreferrer">News · The Guardian</a></li>
              <li><a href="https://www.espn.com/soccer/" target="_blank" rel="noopener noreferrer">News · ESPN &amp; Sky Sports</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {year} Sportscast · Built by Aravind Shajan</span>
          <span className={styles.pulse}><i /> Live data refreshes automatically</span>
        </div>
      </div>
    </footer>
  );
}
