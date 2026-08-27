import { useEffect, useLayoutEffect, useRef } from 'react';
import { Activity, LayoutDashboard, Newspaper, Users, CalendarDays, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { useReveal } from '@/hooks/useReveal.js';
import { animate, countUp, createScope, ensureVisible, prefersReducedMotion, stagger, utils } from '@/lib/anim.js';
import BrandLogo from '@/components/ui/BrandLogo.jsx';
import styles from './AboutSection.module.css';

const FEATURES = [
  {
    icon: Activity,
    title: 'Live scores',
    text: 'Real-time scores, goals and match minutes from competitions around the world, refreshed automatically every 60 seconds.',
    tint: 'live',
  },
  {
    icon: LayoutDashboard,
    title: 'Match centre',
    text: 'Deep-dive into any game: incident timeline, lineups on a 3D pitch, possession and shot stats, and head-to-head history.',
    tint: 'accent',
  },
  {
    icon: Newspaper,
    title: 'News hub',
    text: 'Headlines aggregated from BBC Sport, The Guardian, ESPN and Sky Sports in one clean, distraction-free feed.',
    tint: 'info',
  },
  {
    icon: Users,
    title: 'Fan community',
    text: 'Create a free account to comment on matches, share opinions and follow the conversation with other supporters.',
    tint: 'success',
  },
];

const STATS = [
  { value: 1000, suffix: '+', label: 'Competitions covered' },
  { value: 60, suffix: 's', label: 'Live refresh interval' },
  { value: 4, suffix: '', label: 'Trusted news sources' },
];

export default function AboutSection() {
  const featRef = useRef(null);
  const statsRef = useRef(null);
  const revealRef = useReveal([]);

  // Feature cards pop in with a stagger the first time they scroll into view.
  useLayoutEffect(() => {
    const root = featRef.current;
    if (!root) return undefined;
    const cards = root.querySelectorAll('[data-feature]');
    if (!cards.length) return undefined;
    if (prefersReducedMotion()) {
      ensureVisible(cards);
      return undefined;
    }
    let scope;
    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      try {
        scope = createScope({ root }).add(() => {
          animate(cards, {
            opacity: [0, 1],
            scale: [0.86, 1],
            translateY: [26, 0],
            duration: 750,
            delay: stagger(90),
            ease: 'outBack(1.5)',
          });
          animate(root.querySelectorAll('[data-feature-icon]'), {
            rotate: [-18, 0],
            scale: [0.5, 1],
            duration: 900,
            delay: stagger(90, { start: 120 }),
            ease: 'outElastic(1, .6)',
          });
        });
      } catch {
        ensureVisible(cards);
      }
    };
    try {
      utils.set(cards, { opacity: 0 });
    } catch {
      /* ignore */
    }
    const safety = setTimeout(() => {
      if (!played) ensureVisible(cards);
    }, 4000);
    let io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            play();
            io.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(root);
    } else {
      play();
    }
    return () => {
      clearTimeout(safety);
      io?.disconnect();
      scope?.revert();
      ensureVisible(cards);
    };
  }, []);

  // Animated stat strip (count up once visible).
  useEffect(() => {
    const root = statsRef.current;
    if (!root) return undefined;
    const els = Array.from(root.querySelectorAll('[data-count]'));
    const run = () => {
      els.forEach((el, i) => {
        const to = Number(el.dataset.count);
        const suffix = el.dataset.suffix ?? '';
        setTimeout(() => countUp(el, to, { duration: 1400, format: (v) => `${Math.round(v)}${suffix}` }), i * 120);
      });
    };
    if (!('IntersectionObserver' in window)) {
      run();
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section className={`container section ${styles.section}`} ref={revealRef}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow} data-reveal>
            About Sportscast
          </span>
          <h1 className={styles.title} data-reveal>
            Every kick, every headline — <span className="gradient-text">one place</span> for football fans.
          </h1>
          <p className={styles.lead} data-reveal>
            Sportscast brings live scores, fixtures, lineups, in-depth match stats and the latest news together in a fast,
            modern experience built for supporters. It was created by <strong className={styles.author}>Aravind Shajan</strong> as a portfolio project
            — match data comes from LiveScore, and the news feed aggregates RSS headlines from BBC Sport, The Guardian, ESPN and
            Sky Sports.
          </p>
          <div className={styles.actions} data-reveal>
            <Button to="/matches" variant="gradient">
              <CalendarDays size={16} aria-hidden="true" /> Browse matches
            </Button>
            <Button to="/news" variant="outline">
              Read the news <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className={styles.heroArt} data-reveal aria-hidden="true">
          <div className={styles.logoCard}>
            <span className={styles.orb} />
            <span className={`${styles.orb} ${styles.orb2}`} />
            <BrandLogo height={64} className={styles.logo} />
            <span className={styles.logoTag}>Live football, beautifully delivered</span>
          </div>
        </div>
      </div>

      <ul className={styles.stats} ref={statsRef} data-reveal aria-label="Sportscast at a glance">
        {STATS.map((s) => (
          <li key={s.label} className={styles.stat}>
            <span className={styles.statValue} data-count={s.value} data-suffix={s.suffix}>
              0{s.suffix}
            </span>
            <span className={styles.statLabel}>{s.label}</span>
          </li>
        ))}
      </ul>

      <ul className={styles.features} ref={featRef} aria-label="What you get">
        {FEATURES.map(({ icon: Icon, title, text, tint }) => (
          <li key={title} className={`${styles.feature} ${styles[tint]}`} data-feature>
            <span className={styles.featureIcon} data-feature-icon>
              <Icon size={22} aria-hidden="true" />
            </span>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureText}>{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
