import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Activity, MessageSquareText, Radio } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.js';
import { animate, createScope, prefersReducedMotion, stagger, utils } from '@/lib/anim.js';
import LoginForm from './LoginForm.jsx';
import SignupForm from './SignupForm.jsx';
import { safeNext } from './validation.js';
import styles from './AuthPage.module.css';

const FEATURES = [
  { icon: Radio, title: 'Live scores', text: 'Every goal, card and sub as it happens.' },
  { icon: Activity, title: 'Match centre', text: 'Stats, lineups and head-to-head in one place.' },
  { icon: MessageSquareText, title: 'Fan comments', text: 'Have your say on every fixture.' },
];

const CHIPS = [
  { home: 'ARS', away: 'CHE', score: '2 – 1', status: "78'", live: true, pos: styles.chipA },
  { home: 'RMA', away: 'BAR', score: '0 – 0', status: 'HT', pos: styles.chipB },
  { home: 'BAY', away: 'DOR', score: '3 – 2', status: 'FT', pos: styles.chipC },
];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 37) % 84)}%`,
  top: `${10 + ((i * 53) % 78)}%`,
  size: 3 + (i % 4) * 1.5,
}));

const ANGLE = { login: 0, signup: 180 };

/** Login / Sign-up page with a 3D flip card. `mode` comes from the route (/login or /signup). */
export default function AuthPage({ mode = 'login' }) {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  // The visible side is local state seeded from the route; if the route changes (Navbar link)
  // we re-derive it during render (the React-sanctioned "adjust state on prop change" pattern).
  const [side, setSide] = useState(mode);
  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setSide(mode);
  }

  useDocumentTitle(side === 'login' ? 'Log in' : 'Create account');

  const cardRef = useRef(null);
  const wrapRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const brandRef = useRef(null);
  const angleRef = useRef(ANGLE[mode]);
  const mounted = useRef(false);

  // ---- card height follows the ACTIVE face (both faces are absolutely positioned) ----
  useLayoutEffect(() => {
    const card = cardRef.current;
    const face = (side === 'login' ? frontRef : backRef).current;
    if (!card || !face) return undefined;
    const sync = () => {
      card.style.height = `${face.offsetHeight}px`;
    };
    sync();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(sync);
    ro.observe(face);
    return () => ro.disconnect();
  }, [side]);

  // ---- flip animation -------------------------------------------------
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const to = ANGLE[side];
    const from = angleRef.current;
    angleRef.current = to;
    if (!mounted.current || from === to || prefersReducedMotion()) {
      mounted.current = true;
      utils.set(card, { rotateY: to });
      return undefined;
    }
    const wrap = wrapRef.current;
    const anim = animate(card, { rotateY: [from, to], duration: 760, ease: 'inOutQuad' });
    const lift = wrap
      ? animate(wrap, { scale: [1, 1.035, 1], y: [0, -10, 0], duration: 760, ease: 'inOutQuad' })
      : null;
    return () => {
      anim.pause();
      lift?.pause();
      utils.set(card, { rotateY: to });
      if (wrap) utils.set(wrap, { scale: 1, y: 0 });
    };
  }, [side]);

  // ---- brand panel ambience -------------------------------------------
  useEffect(() => {
    const root = brandRef.current;
    if (!root) return undefined;
    if (prefersReducedMotion()) {
      utils.set(root.querySelectorAll('[data-enter]'), { opacity: 1, y: 0 });
      return undefined;
    }
    const scope = createScope({ root }).add(() => {
      animate('[data-enter]', {
        opacity: [0, 1],
        y: [18, 0],
        duration: 900,
        delay: stagger(90, { start: 120 }),
        ease: 'outExpo',
      });
      root.querySelectorAll('[data-chip]').forEach((chip, i) => {
        animate(chip, {
          y: [-9 - i * 2, 9 + i * 2],
          rotateY: [-10 + i * 3, 10 - i * 3],
          rotateX: [5, -5],
          duration: 3400 + i * 700,
          delay: i * 260,
          loop: true,
          alternate: true,
          ease: 'inOutSine',
        });
      });
      animate('[data-particle]', {
        opacity: [0.15, 0.85],
        scale: [0.6, 1.3],
        y: [-12, 12],
        duration: () => utils.random(2400, 5200),
        delay: stagger(140),
        loop: true,
        alternate: true,
        ease: 'inOutSine',
      });
    });
    return () => scope.revert();
  }, []);

  // Shake the card on a failed submit.
  const shake = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || prefersReducedMotion()) return;
    animate(wrap, { x: [-8, 8, -6, 6, 0], duration: 420, ease: 'inOutSine' });
  }, []);

  const switchTo = useCallback((target) => {
    setSide(target);
    // keep the URL honest without triggering a router re-render / page transition
    const url = `/${target}${window.location.search}`;
    window.history.replaceState(window.history.state, '', url);
  }, []);

  if (isAuthenticated) return <Navigate to={next} replace />;

  const isLogin = side === 'login';

  return (
    <div className={styles.page}>
      {/* ---------- brand panel ---------- */}
      <aside className={styles.brand} ref={brandRef} aria-label="About SportsLive">
        <div className={styles.brandInner}>
          <img className={styles.logo} src="/logo/logo-no-background.png" alt="SportsLive" data-enter />
          <h2 className={styles.headline} data-enter>
            Your seat <span className={styles.headlineAccent}>in the stands.</span>
          </h2>
          <p className={styles.tagline} data-enter>
            Live football, minute by minute — and a place to talk about it with other fans.
          </p>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={styles.feature} data-enter>
                <span className={styles.featureIcon}>
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <span className={styles.featureText}>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.ambient} aria-hidden="true">
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              data-particle
              className={styles.particle}
              style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            />
          ))}
          {CHIPS.map((c) => (
            <div key={c.home + c.away} data-chip className={`${styles.chip} ${c.pos}`}>
              <span className={`${styles.chipStatus} ${c.live ? styles.chipLive : ''}`}>{c.status}</span>
              <span className={styles.chipTeams}>
                <span>{c.home}</span>
                <span className={styles.chipScore}>{c.score}</span>
                <span>{c.away}</span>
              </span>
            </div>
          ))}
          <span className={styles.glowA} />
          <span className={styles.glowB} />
        </div>
      </aside>

      {/* ---------- auth card ---------- */}
      <div className={styles.formSide}>
        <div className={styles.scene}>
          <div className={styles.cardWrap} ref={wrapRef}>
            <div className={styles.card} ref={cardRef} data-side={side}>
              <section
                ref={frontRef}
                className={`${styles.face} ${styles.front}`}
                aria-hidden={!isLogin}
                inert={!isLogin}
                aria-label="Log in"
              >
                <LoginForm next={next} onSwitch={() => switchTo('signup')} onError={shake} />
              </section>
              <section
                ref={backRef}
                className={`${styles.face} ${styles.back}`}
                aria-hidden={isLogin}
                inert={isLogin}
                aria-label="Create account"
              >
                <SignupForm next={next} onSwitch={() => switchTo('login')} onError={shake} />
              </section>
            </div>
          </div>
          <p className={styles.legal}>
            By continuing you agree to keep it friendly in the comments. No spam, ever.
          </p>
        </div>
      </div>
    </div>
  );
}
