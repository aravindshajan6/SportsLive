import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Newspaper, Radio } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { useIsMobile, usePrefersReducedMotion } from '@/hooks/useMediaQuery.js';
import { animate, createScope, createSpring, ensureVisible, stagger, utils } from '@/lib/anim.js';
import { formatTime, matchStatusText, relativeDayLabel } from '@/lib/format.js';
import styles from './Hero.module.css';

const HEADLINE = [
  { text: 'Sports', cls: styles.word },
  { text: 'cast', cls: `${styles.word} ${styles.wordAccent}` },
];

function ScoreboardCard({ featured, loading, liveCount, cardRef, glareRef }) {
  const match = featured?.match;
  const reason = featured?.reason;

  let body;
  if (match) {
    const hasScore = match.homeScore !== null && match.homeScore !== undefined;
    const status = matchStatusText(match);
    body = (
      <>
        <div className={styles.cardTop}>
          <span className={styles.cardComp}>
            {match.competition?.name}
            {match.competition?.country ? <span className={styles.cardCountry}> · {match.competition.country}</span> : null}
          </span>
          <span className={[styles.cardStatus, match.isLive && styles.cardStatusLive].filter(Boolean).join(' ')}>
            {match.isLive && <span className={styles.cardDot} aria-hidden="true" />}
            {match.isLive ? status : reason === 'upcoming' ? relativeDayLabel(match.startTime) : match.statusLabel || status}
          </span>
        </div>
        <div className={styles.cardTeams}>
          <div className={styles.cardTeam}>
            <TeamBadge src={match.home?.badge} name={match.home?.name} size={56} className={styles.cardBadge} />
            <span className={styles.cardAbbr}>{match.home?.abbr || match.home?.name}</span>
          </div>
          <div className={styles.cardScore}>
            {hasScore ? (
              <>
                <span>{match.homeScore}</span>
                <span className={styles.cardSep}>:</span>
                <span>{match.awayScore}</span>
              </>
            ) : (
              <span className={styles.cardKick}>{formatTime(match.startTime)}</span>
            )}
          </div>
          <div className={styles.cardTeam}>
            <TeamBadge src={match.away?.badge} name={match.away?.name} size={56} className={styles.cardBadge} />
            <span className={styles.cardAbbr}>{match.away?.abbr || match.away?.name}</span>
          </div>
        </div>
        <div className={styles.cardNames}>
          <span>{match.home?.name}</span>
          <span>{match.away?.name}</span>
        </div>
        <Link to={`/match/${match.id}`} className={styles.cardLink}>
          Match centre <ArrowRight size={14} />
        </Link>
      </>
    );
  } else {
    body = (
      <>
        <div className={styles.cardTop}>
          <span className={styles.cardComp}>Sportscast</span>
          <span className={`${styles.cardStatus} ${styles.cardStatusLive}`}>
            <span className={styles.cardDot} aria-hidden="true" />
            Live
          </span>
        </div>
        <div className={styles.cardTeams}>
          <div className={styles.cardTeam}>
            <span className={styles.ghostBadge} aria-hidden="true">
              SL
            </span>
            <span className={styles.cardAbbr}>{loading ? '…' : 'HOME'}</span>
          </div>
          <div className={styles.cardScore}>
            <span>{loading ? '–' : '0'}</span>
            <span className={styles.cardSep}>:</span>
            <span>{loading ? '–' : '0'}</span>
          </div>
          <div className={styles.cardTeam}>
            <span className={styles.ghostBadge} aria-hidden="true">
              SL
            </span>
            <span className={styles.cardAbbr}>{loading ? '…' : 'AWAY'}</span>
          </div>
        </div>
        <p className={styles.cardHint}>
          {loading ? 'Loading today’s fixtures…' : 'Scores from 1,000+ competitions, refreshed every minute.'}
        </p>
        <Link to="/matches" className={styles.cardLink}>
          Browse fixtures <ArrowRight size={14} />
        </Link>
      </>
    );
  }

  return (
    <div ref={cardRef} className={styles.card} aria-label={match ? 'Featured match' : 'Live scoreboard'}>
      <span ref={glareRef} className={styles.glare} aria-hidden="true" />
      <span className={styles.cardShine} aria-hidden="true" />
      {body}
      {liveCount > 0 && (
        <span className={styles.cardTag}>
          {liveCount} live now
        </span>
      )}
    </div>
  );
}

export default function Hero({ featured, loading, liveCount = 0 }) {
  const rootRef = useRef(null);
  const floatRef = useRef(null);
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const particlesRef = useRef(null);
  const cueRef = useRef(null);
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  const particles = useMemo(() => {
    const count = isMobile ? 12 : 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: utils.random(0, 100),
      top: utils.random(0, 100),
      size: utils.random(3, 10),
      cyan: i % 3 === 0,
    }));
  }, [isMobile]);

  // Intro: staggered 3D letter reveal, fades, card entrance + float, particles drift, scroll cue bounce.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const letters = root.querySelectorAll('[data-letter]');
    const fades = root.querySelectorAll('[data-fade]');
    const dots = particlesRef.current ? Array.from(particlesRef.current.children) : [];
    const floater = floatRef.current;
    const cue = cueRef.current;

    if (reduced) {
      ensureVisible([...letters, ...fades, floater, cue].filter(Boolean));
      dots.forEach((d) => utils.set(d, { opacity: 0.5 }));
      return undefined;
    }

    let scope;
    try {
      scope = createScope({ root }).add(() => {
        animate(letters, {
          opacity: [0, 1],
          translateY: [70, 0],
          rotateX: [-80, 0],
          scale: [0.7, 1],
          duration: 1100,
          delay: stagger(50, { start: 120 }),
          ease: 'outExpo',
        });
        animate(fades, {
          opacity: [0, 1],
          translateY: [26, 0],
          duration: 900,
          delay: stagger(110, { start: 520 }),
          ease: 'outExpo',
        });
        if (floater) {
          animate(floater, {
            opacity: [0, 1],
            translateY: [60, 0],
            scale: [0.86, 1],
            duration: 1200,
            delay: 380,
            ease: 'outExpo',
          });
          // gentle idle float (separate wrapper so it doesn't fight the pointer tilt)
          animate(floater, {
            translateY: [-7, 7],
            rotate: [-0.7, 0.7],
            duration: 3800,
            delay: 1600,
            loop: true,
            alternate: true,
            ease: 'inOutSine',
          });
        }
        dots.forEach((d) => {
          animate(d, {
            translateX: [utils.random(-40, 40), utils.random(-40, 40)],
            translateY: [utils.random(-70, 70), utils.random(-70, 70)],
            opacity: [utils.random(0.1, 0.35), utils.random(0.55, 0.95)],
            scale: [utils.random(0.5, 1), utils.random(1, 1.7)],
            duration: utils.random(4000, 9000),
            delay: utils.random(0, 2500),
            loop: true,
            alternate: true,
            ease: 'inOutSine',
          });
        });
        if (cue) {
          animate(cue, { translateY: [0, 10], opacity: [0.45, 1], duration: 900, loop: true, alternate: true, ease: 'inOutQuad' });
        }
      });
    } catch {
      ensureVisible([...letters, ...fades, floater, cue].filter(Boolean));
    }
    return () => scope?.revert();
  }, [reduced, particles]);

  // Pointer parallax: card tilts (spring), glare follows, particles drift the other way.
  useEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    if (!root || !card || reduced) return undefined;
    if (window.matchMedia?.('(hover: none)').matches) return undefined;

    const spring = createSpring({ stiffness: 80, damping: 11 });
    let current = null;
    const tilt = (rx, ry) => {
      current?.pause();
      current = animate(card, { rotateX: rx, rotateY: ry, ease: spring });
    };
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt(-py * 16, px * 20);
      const glare = glareRef.current;
      if (glare) {
        const c = card.getBoundingClientRect();
        glare.style.setProperty('--gx', `${((e.clientX - c.left) / c.width) * 100}%`);
        glare.style.setProperty('--gy', `${((e.clientY - c.top) / c.height) * 100}%`);
        glare.style.opacity = '1';
      }
      if (particlesRef.current) utils.set(particlesRef.current, { translateX: px * -30, translateY: py * -30 });
    };
    const onLeave = () => {
      tilt(0, 0);
      if (glareRef.current) glareRef.current.style.opacity = '0';
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      current?.pause();
      utils.set(card, { rotateX: 0, rotateY: 0 });
    };
  }, [reduced]);

  return (
    <section ref={rootRef} className={styles.hero} aria-labelledby="hero-title">
      <video
        className={styles.video}
        src="/assets/hero.mp4"
        poster="/assets/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div ref={particlesRef} className={styles.particles} aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className={[styles.particle, p.cyan && styles.particleCyan].filter(Boolean).join(' ')}
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          />
        ))}
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <span className={styles.kicker} data-fade>
            <Radio size={14} aria-hidden="true" /> Live scores · Fixtures · News
          </span>
          <h1 id="hero-title" className={styles.title}>
            <span className="visually-hidden">Sportscast</span>
            <span className={styles.letters} aria-hidden="true">
              {HEADLINE.map((w) => (
                <span key={w.text} className={w.cls}>
                  {w.text.split('').map((ch, i) => (
                    <span key={`${w.text}-${i}`} className={styles.letter} data-letter>
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </h1>
          <p className={styles.tagline} data-fade>
            One stop for all football enthusiasts
          </p>
          <p className={styles.lead} data-fade>
            Real-time scores from leagues around the world, match centres with lineups and stats, and the latest headlines — all in
            one place.
          </p>
          <div className={styles.ctas} data-fade>
            <Button to="/matches" variant="gradient" size="lg">
              <Radio size={18} aria-hidden="true" /> Live matches
            </Button>
            <Button to="/news" variant="outline" size="lg" className={styles.ctaGhost}>
              <Newspaper size={18} aria-hidden="true" /> Latest news
            </Button>
          </div>
        </div>

        <div className={styles.cardWrap}>
          <div ref={floatRef} className={styles.floater}>
            <ScoreboardCard featured={featured} loading={loading} liveCount={liveCount} cardRef={cardRef} glareRef={glareRef} />
          </div>
        </div>
      </div>

      <a ref={cueRef} href="#home-content" className={styles.cue} aria-label="Scroll to content">
        <ChevronDown size={22} />
      </a>
    </section>
  );
}
