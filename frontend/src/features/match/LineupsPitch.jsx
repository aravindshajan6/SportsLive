import { useEffect, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, Bandage, UserRound } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState.jsx';
import TeamBadge from '@/components/ui/TeamBadge.jsx';
import { animate, ensureVisible, prefersReducedMotion, stagger } from '@/lib/anim.js';
import { Shirt } from 'lucide-react';
import styles from './LineupsPitch.module.css';

/** "row:col" -> [row, col] (row 1 = GK). */
function parsePos(fp) {
  const [r, c] = String(fp || '').split(':').map(Number);
  return Number.isFinite(r) && Number.isFinite(c) ? [r, c] : null;
}

/**
 * Place starters on one full pitch. Home occupies the bottom half (GK at the bottom),
 * away the top half (GK at the top, columns mirrored so both teams "face" the centre).
 */
function placeTeam(starters, side) {
  const rowsMap = new Map();
  starters.forEach((p) => {
    const pos = parsePos(p.formatPosition);
    if (!pos) return;
    if (!rowsMap.has(pos[0])) rowsMap.set(pos[0], []);
    rowsMap.get(pos[0]).push({ player: p, col: pos[1] });
  });
  const rowNums = Array.from(rowsMap.keys()).sort((a, b) => a - b);
  const maxRow = rowNums.length;
  const out = [];
  rowNums.forEach((rowNum, rowIdx) => {
    const row = rowsMap.get(rowNum).sort((a, b) => a.col - b.col);
    const n = row.length;
    const t = maxRow > 1 ? rowIdx / (maxRow - 1) : 0; // 0 = GK line, 1 = most advanced line
    row.forEach(({ player }, i) => {
      let x = ((i + 0.5) / n) * 100;
      let y;
      if (side === 'home') {
        y = 93 - t * 37;
      } else {
        y = 7 + t * 37;
        x = 100 - x;
      }
      out.push({ player, x, y, side });
    });
  });
  return out;
}

function ratingTone(r) {
  if (r >= 7) return styles.rateGood;
  if (r >= 6) return styles.rateOk;
  return styles.rateLow;
}

function shortName(p) {
  return p.lastName || p.name?.split(' ').slice(-1)[0] || p.name || '';
}

function PlayerList({ title, icon: Icon, players, renderMeta, empty }) {
  return (
    <div className={styles.list}>
      <h4 className={styles.listTitle}>
        {Icon && <Icon size={14} />} {title}
      </h4>
      {players.length ? (
        <ul>
          {players.map((p, i) => (
            <li key={`${p.id || i}`} className={styles.listRow}>
              <span className={styles.num}>{p.number ?? '–'}</span>
              <span className={styles.pname}>{p.name}</span>
              <span className={styles.pmeta}>{renderMeta ? renderMeta(p) : p.positionName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.listEmpty}>{empty}</p>
      )}
    </div>
  );
}

function TeamPanel({ team, side, lineup, subs }) {
  const formation = lineup.formation?.length ? lineup.formation.join('-') : null;
  return (
    <section className={`${styles.panel} ${styles[side]}`} aria-label={`${team.name} squad`}>
      <header className={styles.panelHead}>
        <TeamBadge src={team.badge} name={team.name} size={30} />
        <div className={styles.panelTitle}>
          <span className={styles.panelName}>{team.name}</span>
          {lineup.coach?.name && <span className={styles.coach}>Coach: {lineup.coach.name}</span>}
        </div>
        {formation && <span className={styles.formation}>{formation}</span>}
      </header>

      {subs?.length > 0 && (
        <div className={styles.list}>
          <h4 className={styles.listTitle}>
            <ArrowUp size={14} /> Substitutions
          </h4>
          <ul>
            {subs.map((s, i) => (
              <li key={i} className={`${styles.listRow} ${styles.subRow}`}>
                <span className={styles.num}>{s.minute}&rsquo;</span>
                <span className={styles.pname}>
                  <span className={styles.subIn}>
                    <ArrowUp size={12} /> {s.playerIn?.name}
                  </span>
                  <span className={styles.subOut}>
                    <ArrowDown size={12} /> {s.playerOut?.name}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PlayerList title="Bench" icon={UserRound} players={lineup.bench || []} empty="No bench announced" />

      {lineup.injured?.length > 0 && (
        <PlayerList
          title="Injured & suspended"
          icon={Bandage}
          players={lineup.injured}
          renderMeta={(p) => p.reason || p.returnInfo || p.positionName}
        />
      )}
    </section>
  );
}

export default function LineupsPitch({ lineups, match }) {
  const pitchRef = useRef(null);
  const home = lineups?.home || { formation: [], starters: [], bench: [], injured: [] };
  const away = lineups?.away || { formation: [], starters: [], bench: [], injured: [] };
  const hasHome = home.starters?.length > 0;
  const hasAway = away.starters?.length > 0;

  const dots = useMemo(
    () => [...(hasAway ? placeTeam(away.starters, 'away') : []), ...(hasHome ? placeTeam(home.starters, 'home') : [])],
    [home.starters, away.starters, hasHome, hasAway],
  );

  useEffect(() => {
    const root = pitchRef.current;
    if (!root || !dots.length) return undefined;
    const bodies = Array.from(root.querySelectorAll('[data-dot]'));
    if (prefersReducedMotion()) return undefined;
    let anim;
    try {
      anim = animate(bodies, {
        opacity: [0, 1],
        y: [-46, 0],
        scale: [0.5, 1],
        duration: 800,
        ease: 'outBack(1.6)',
        delay: stagger(45, { start: 150 }),
      });
    } catch {
      ensureVisible(bodies);
    }
    const safety = setTimeout(() => ensureVisible(bodies), 3500);
    return () => {
      clearTimeout(safety);
      anim?.pause();
      ensureVisible(bodies);
    };
  }, [dots]);

  if (!hasHome && !hasAway) {
    return (
      <EmptyState
        icon={Shirt}
        title="Lineups not announced yet"
        description="Starting XIs are usually published around an hour before kick-off. Check back closer to the match."
      />
    );
  }

  const homeFormation = home.formation?.length ? home.formation.join('-') : null;
  const awayFormation = away.formation?.length ? away.formation.join('-') : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.pitchLegend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendAway}`} /> {match.away.name}
          {awayFormation && <span className={styles.legendForm}>{awayFormation}</span>}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendHome}`} /> {match.home.name}
          {homeFormation && <span className={styles.legendForm}>{homeFormation}</span>}
        </span>
      </div>

      <div className={styles.stage}>
        <div ref={pitchRef} className={styles.pitch} role="img" aria-label="Starting lineups on the pitch">
          <div className={styles.lines} aria-hidden="true">
            <span className={styles.halfway} />
            <span className={styles.circle} />
            <span className={styles.spot} />
            <span className={`${styles.box} ${styles.boxTop}`} />
            <span className={`${styles.box6} ${styles.box6Top}`} />
            <span className={`${styles.box} ${styles.boxBottom}`} />
            <span className={`${styles.box6} ${styles.box6Bottom}`} />
            <span className={`${styles.arc} ${styles.arcTop}`} />
            <span className={`${styles.arc} ${styles.arcBottom}`} />
          </div>
          {!hasAway && <span className={`${styles.notice} ${styles.noticeTop}`}>{match.away.name}: lineup not announced</span>}
          {!hasHome && <span className={`${styles.notice} ${styles.noticeBottom}`}>{match.home.name}: lineup not announced</span>}
          {dots.map(({ player, x, y, side }) => (
            <div key={`${side}-${player.id}`} className={`${styles.dotSpot} ${styles[side]}`} style={{ left: `${x}%`, top: `${y}%` }}>
              <div className={styles.stand}>
                <div className={styles.dotBody} data-dot title={`${player.name}${player.positionName ? ` · ${player.positionName}` : ''}`}>
                  <span className={styles.dot}>
                    {player.number ?? ''}
                    {player.rating !== null && player.rating !== undefined && (
                      <span className={`${styles.rate} ${ratingTone(player.rating)}`}>{Number(player.rating).toFixed(1)}</span>
                    )}
                  </span>
                  <span className={styles.dotName}>{shortName(player)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.panels}>
        <TeamPanel team={match.home} side="home" lineup={home} subs={lineups?.substitutions?.home || []} />
        <TeamPanel team={match.away} side="away" lineup={away} subs={lineups?.substitutions?.away || []} />
      </div>
    </div>
  );
}
