'use strict';

/**
 * Normalizers: LiveScore (RapidAPI) upstream JSON -> the public API contract.
 * Upstream field names are UPPER_SNAKE (MATCH_ID, HOME_TEAM[0].BADGE_SOURCE, ...).
 */

const COMPETITION_BADGE_BASE = 'https://static.livescore.com/competition/high/';
// Player headshots: upstream only exposes a file name (imageUrl: "18026122.png") and no
// public CDN path could be verified, so player.image is null unless a base is configured.
const PLAYER_IMAGE_BASE = process.env.LIVESCORE_PLAYER_IMAGE_BASE || null;

const STATUS_LABELS = {
  NS: 'Not started',
  FT: 'Full time',
  HT: 'Half time',
  AET: 'After extra time',
  AP: 'Penalties',
  ET: 'Extra time',
  Pen: 'Penalty shootout',
  'Pen.': 'Penalty shootout',
  'Postp.': 'Postponed',
  'Aband.': 'Abandoned',
  'Canc.': 'Cancelled',
  'Susp.': 'Suspended',
  Int: 'Interrupted',
  'Int.': 'Interrupted',
  Delayed: 'Delayed',
  TBC: 'To be confirmed',
  AW: 'Awarded',
  'W.O.': 'Walkover',
};

// Observed: 36 goal, 37 penalty goal, 43 yellow, 63 assist, 62 VAR (INCIDENT_REASON "VAR:disallowed_offside"),
// 4 substitution off, 5 substitution on. 38/39/44/45 are the documented assumptions.
const INCIDENT_TYPES = {
  36: 'goal',
  37: 'penalty',
  38: 'own-goal',
  39: 'missed-penalty',
  43: 'yellow',
  44: 'yellow-red',
  45: 'red',
  4: 'substitution',
  5: 'substitution',
  62: 'var',
  63: 'assist',
};
const GOAL_TYPES = new Set(['goal', 'penalty', 'own-goal']);
const PERIOD_LABELS = { 1: '1st Half', 2: '2nd Half', 3: 'Extra time', 4: 'Penalties' };

const STAT_FIELDS = [
  ['POSSESSION', 'possession', 'Possession', '%'],
  ['SHOTS_ON_TARGET', 'shotsOnTarget', 'Shots on target'],
  ['SHOTS_OFF_TARGET', 'shotsOffTarget', 'Shots off target'],
  ['BLOCKED_SHOTS', 'blockedShots', 'Blocked shots'],
  ['CORNER_KICKS', 'corners', 'Corners'],
  ['FOULS', 'fouls', 'Fouls'],
  ['OFFSIDES', 'offsides', 'Offsides'],
  ['YELLOW_CARDS', 'yellowCards', 'Yellow cards'],
  ['RED_CARDS', 'redCards', 'Red cards'],
  ['GOALKEEPER_SAVES', 'saves', 'Saves'],
  ['THROW_INS', 'throwIns', 'Throw-ins'],
  ['GOAL_KICKS', 'goalKicks', 'Goal kicks'],
  ['CROSSES', 'crosses', 'Crosses'],
  ['COUNTER_ATTACKS', 'counterAttacks', 'Counter attacks'],
  ['Xg', 'xg', 'Expected goals (xG)'],
];

/* ----------------------------------------------------------------- helpers */

function str(value) {
  return value === undefined || value === null ? '' : String(value);
}

function toInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNum(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function utcIso(y, mo, d, h, mi, s) {
  const t = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0));
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** MATCH_START_DATE is "YYYY-MM-DD HH:mm:ss" (list) or "YYYYMMDDHHmmss" (scoreboard/h2h, sometimes a number). Treated as UTC. */
function parseUpstreamDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return utcIso(m[1], m[2], m[3], m[4] || 0, m[5] || 0, m[6]);
  m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  if (m) return utcIso(m[1], m[2], m[3], m[4], m[5], m[6]);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function hexColor(value) {
  if (!value) return null;
  const v = String(value).replace(/^#/, '');
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toUpperCase()}` : null;
}

function abbrFromName(name) {
  return str(name).replace(/[^A-Za-z0-9 ]/g, '').slice(0, 3).toUpperCase();
}

function joinName(raw) {
  const full = [raw.PLAYER_FIRST_NAME, raw.PLAYER_LAST_NAME].filter(Boolean).join(' ').trim();
  return full || str(raw.STAGE_NAME) || str(raw.PLAYER_NAME);
}

function scoreTuple(value) {
  if (!Array.isArray(value) || value.length < 2) return null;
  return [toInt(value[0]) ?? 0, toInt(value[1]) ?? 0];
}

/* ------------------------------------------------------------------ status */

function statusInfo(status, overall) {
  const raw = str(status).trim();
  let phase = null;
  switch (toInt(overall)) {
    case 0: phase = 'upcoming'; break;
    case 1: phase = 'live'; break;
    case 2: phase = 'finished'; break;
    case 4: phase = 'postponed'; break;
    case 8: phase = 'abandoned'; break;
    default: phase = null;
  }
  if (!phase) {
    if (/^\d+/.test(raw) || /^(HT|ET|Pen)/i.test(raw)) phase = 'live';
    else if (raw === 'NS') phase = 'upcoming';
    else if (/^(FT|AET|AP|AW)$/.test(raw)) phase = 'finished';
    else if (/^Postp/i.test(raw)) phase = 'postponed';
    else if (/^Aband/i.test(raw)) phase = 'abandoned';
    else if (/^Canc/i.test(raw)) phase = 'cancelled';
    else phase = 'unknown';
  }
  let statusLabel = STATUS_LABELS[raw];
  if (!statusLabel) {
    if (/^\d+(\+\d+)?'?$/.test(raw)) statusLabel = raw.endsWith("'") ? raw : `${raw}'`;
    else statusLabel = raw || 'Unknown';
  }
  return { status: raw, statusLabel, phase, isLive: phase === 'live', isFinished: phase === 'finished' };
}

/** WHICH_TEAM_WON: 1 = home, 2 = away, 0 = draw (for AP it is the shootout winner; for two-legged ties the side advancing). */
function winnerFrom(whichTeamWon, isFinished) {
  if (!isFinished) return null;
  switch (toInt(whichTeamWon)) {
    case 1: return 'home';
    case 2: return 'away';
    case 0: return 'draw';
    default: return null;
  }
}

/* ------------------------------------------------------------- team / comp */

function normalizeTeam(value) {
  const team = Array.isArray(value) ? value[0] : value;
  if (!team) return { id: '', name: '', abbr: '', badge: null };
  const name = str(team.NAME);
  return {
    id: str(team.ID),
    name,
    abbr: str(team.ABBREVIATION) || abbrFromName(name),
    badge: team.BADGE_SOURCE ? String(team.BADGE_SOURCE) : null,
  };
}

function normalizeCompetition(stage) {
  const s = stage || {};
  return {
    id: str(s.STAGE_ID || s.COMPETITION_ID),
    name: str(s.COMPETITION_NAME || s.STAGE_NAME),
    // COMPETITION_DESCRIPTION is usually the country ("Spain", "UEFA") but is sometimes a
    // season/year ("2025" for Leagues Cup) — fall back to COUNTRY_NAME when it isn't a name.
    country: /^[\d\s/-]+$/.test(str(s.COMPETITION_DESCRIPTION))
      ? str(s.COUNTRY_NAME || s.COMPETITION_DESCRIPTION)
      : str(s.COMPETITION_DESCRIPTION || s.COUNTRY_NAME),
    stageName: str(s.STAGE_NAME),
    color: hexColor(s.firstColor),
    isCup: toInt(s.IS_CUP) === 1,
    badge: s.badgeUrl ? `${COMPETITION_BADGE_BASE}${s.badgeUrl}` : null,
  };
}

/* ------------------------------------------------------------------- match */

function normalizeMatch(ev, stage) {
  const e = ev || {};
  const st = statusInfo(e.MATCH_STATUS, e.MATCH_STATUS_OVERALL);
  const home = normalizeTeam(e.HOME_TEAM);
  const away = normalizeTeam(e.AWAY_TEAM);
  const startTime = parseUpstreamDate(e.MATCH_START_DATE);
  const upcoming = st.phase === 'upcoming';

  const match = {
    id: str(e.MATCH_ID) || `${(startTime || '').replace(/\D/g, '').slice(0, 12)}-${home.id}-${away.id}`,
    status: st.status,
    statusLabel: st.statusLabel,
    phase: st.phase,
    isLive: st.isLive,
    isFinished: st.isFinished,
    startTime,
    home,
    away,
    homeScore: upcoming ? null : toInt(e.HOME_SCORE),
    awayScore: upcoming ? null : toInt(e.AWAY_SCORE),
  };

  const series = e.seriesInfo;
  if (series && (series.aggScoreTeam1 !== undefined || series.aggScoreTeam2 !== undefined)) {
    match.aggregate = {
      home: toInt(series.aggScoreTeam1) ?? 0,
      away: toInt(series.aggScoreTeam2) ?? 0,
      leg: toInt(series.currentLeg) ?? 1,
      totalLegs: toInt(series.totalLegs) ?? 2,
    };
  }
  if (e.HOME_PENALTY_SHOOT_OUT_PERIOD_SCORE !== undefined || e.AWAY_PENALTY_SHOOT_OUT_PERIOD_SCORE !== undefined) {
    match.penalties = {
      home: toInt(e.HOME_PENALTY_SHOOT_OUT_PERIOD_SCORE),
      away: toInt(e.AWAY_PENALTY_SHOOT_OUT_PERIOD_SCORE),
    };
  }
  match.competition = normalizeCompetition(stage || e.STAGE);
  return match;
}

/** /v1/events/live and /v1/events/list -> { competitions, matches } */
function normalizeList(json) {
  const stages = Array.isArray(json && json.DATA) ? json.DATA : [];
  const competitions = [];
  const matches = [];
  for (const stage of stages) {
    const events = Array.isArray(stage.EVENTS) ? stage.EVENTS : [];
    if (!events.length) continue;
    const group = { ...normalizeCompetition(stage), matches: events.map((ev) => normalizeMatch(ev, stage)) };
    competitions.push(group);
    matches.push(...group.matches);
  }
  return { competitions, matches };
}

/* --------------------------------------------------------------- incidents */

function incidentPlayer(raw) {
  if (!raw) return null;
  const id = raw.PLAYER_ID ?? raw.ID;
  const name = str(raw.PLAYER_NAME) || joinName(raw);
  if (id === undefined && !name) return null;
  return { id: str(id), name, number: toInt(raw.PNUM) };
}

function otherPlayer(raw) {
  if (raw.OTHER_PLAYER_ID === undefined || raw.OTHER_PLAYER_ID === null) return undefined;
  return { id: str(raw.OTHER_PLAYER_ID), name: str(raw.OTHER_PLAYER_NAME), number: toInt(raw.PNUM_O) };
}

/** One upstream incident entry (possibly a grouped goal+assist) -> Incident. */
function normalizeIncidentEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;

  if (Array.isArray(raw.INCIDENTS) && raw.INCIDENTS.length) {
    const parts = raw.INCIDENTS.map(normalizeIncidentEntry).filter(Boolean);
    if (!parts.length) return null;
    const primary = parts.find((p) => p.type !== 'assist') || parts[0];
    const assist = parts.find((p) => p !== primary && p.type === 'assist');
    if (assist && assist.player) primary.assist = assist.player;
    if (primary.score === null && Array.isArray(raw.SCORE)) primary.score = scoreTuple(raw.SCORE);
    if (raw.MINUTE !== undefined && toInt(raw.MINUTE) !== null) primary.minute = toInt(raw.MINUTE);
    if (raw.NAME !== undefined) primary.team = toInt(raw.NAME) === 2 ? 'away' : 'home';
    return primary;
  }

  const typeCode = toInt(raw.INCIDENT_TYPE);
  const type = INCIDENT_TYPES[typeCode] || 'other';
  const incident = {
    minute: toInt(raw.MINUTE) ?? 0,
    minuteExtended: toInt(raw.MINUTE_EXTENDED),
    team: toInt(raw.NAME) === 2 ? 'away' : 'home',
    type,
    player: incidentPlayer(raw),
    score: scoreTuple(raw.SCORE),
  };
  if (raw.INCIDENT_REASON) incident.reason = String(raw.INCIDENT_REASON);
  if (type === 'substitution') {
    // 5 = player coming on (player = in, OTHER = out); 4 = player going off (player = out, OTHER = in)
    if (typeCode === 4) {
      incident.playerOut = incident.player;
      incident.player = otherPlayer(raw) || null;
    } else {
      incident.playerOut = otherPlayer(raw);
    }
    Object.defineProperty(incident, '_fromOff', { value: typeCode === 4, enumerable: false });
  }
  return incident;
}

/** When both the "off" and "on" halves of a substitution are present keep only one. */
function dedupeSubstitutions(events) {
  const onKeys = new Set(
    events
      .filter((e) => e.type === 'substitution' && !e._fromOff)
      .map((e) => `${e.team}:${e.minute}:${e.playerOut ? e.playerOut.id : ''}`),
  );
  return events.filter((e) => {
    if (e.type !== 'substitution' || !e._fromOff) return true;
    return !onKeys.has(`${e.team}:${e.minute}:${e.playerOut ? e.playerOut.id : ''}`);
  });
}

function byMinute(a, b) {
  return a.minute - b.minute || (a.minuteExtended ?? 0) - (b.minuteExtended ?? 0);
}

function normalizePeriods(map) {
  if (!map || typeof map !== 'object') return [];
  return Object.keys(map)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
    .map((period) => {
      const raw = Array.isArray(map[period]) ? map[period] : [];
      const events = dedupeSubstitutions(raw.map(normalizeIncidentEntry).filter(Boolean)).sort(byMinute);
      return { period, label: PERIOD_LABELS[period] || `Period ${period}`, events };
    });
}

/** /v1/events/incidents -> Incidents */
function normalizeIncidents(json) {
  const d = json && json.DATA;
  if (!d || typeof d !== 'object') return null;
  return {
    homeScore: toInt(d.HOME_SCORE),
    awayScore: toInt(d.AWAY_SCORE),
    halfTime: { home: toInt(d.HOME_HALF_TIME_SCORE), away: toInt(d.AWAY_HALF_TIME_SCORE) },
    periods: normalizePeriods(d.INCIDENTS),
  };
}

/* -------------------------------------------------------------- scoreboard */

/** /v1/events/scoreboard -> MatchDetail (null when the payload has no match) */
function normalizeScoreboard(json) {
  const d = json && json.DATA;
  if (!d || typeof d !== 'object' || d.MATCH_ID === undefined) return null;
  const match = normalizeMatch(d, d.STAGE);
  const venue = d.Venue && typeof d.Venue === 'object'
    ? { name: str(d.Venue.VENUE_NAME), city: str(d.Venue.VENUE_CITY_NAME), spectators: toInt(d.Venue.SPECTATORS_NUMBER) }
    : null;
  const goals = normalizePeriods(d.MOMENTS)
    .flatMap((p) => p.events.map((e) => ({ ...e, period: p.period })))
    .filter((e) => GOAL_TYPES.has(e.type));
  return {
    ...match,
    halfTime: { home: toInt(d.HOME_HALF_TIME_SCORE), away: toInt(d.AWAY_HALF_TIME_SCORE) },
    fullTime: { home: toInt(d.HOME_FULL_TIME_SCORE), away: toInt(d.AWAY_FULL_TIME_SCORE) },
    winner: winnerFrom(d.WHICH_TEAM_WON, match.isFinished),
    venue,
    endTime: parseUpstreamDate(d.MATCH_END_DATE),
    goals,
  };
}

/* ----------------------------------------------------------------- lineups */

function normalizePlayer(raw) {
  const actual = toInt(raw.PLAYER_POSITION_ACTUAL);
  // For starters PLAYER_POSITION is the real role (1 GK .. 4 FWD); for bench players it is 5 and
  // PosS carries the real role; coaches are 10.
  const position = actual >= 1 && actual <= 4 ? actual : (toInt(raw.PosS) ?? toInt(raw.PLAYER_POSITION) ?? actual ?? 0);
  const rating = toNum(raw.Rate);
  return {
    id: str(raw.PLAYER_ID ?? raw.EXTERNAL_ID),
    name: joinName(raw),
    firstName: str(raw.PLAYER_FIRST_NAME),
    lastName: str(raw.PLAYER_LAST_NAME || raw.STAGE_NAME),
    number: toInt(raw.PLAYER_NUMBER),
    position,
    positionName: str(raw.PLAYER_POSITION_NAME),
    formatPosition: raw.FORMAT_POSITION ? String(raw.FORMAT_POSITION) : null,
    rating,
    image: raw.imageUrl && PLAYER_IMAGE_BASE ? `${PLAYER_IMAGE_BASE}${raw.imageUrl}` : null,
  };
}

function byFormatPosition(a, b) {
  const [ar, ac] = String(a.formatPosition).split(':').map(Number);
  const [br, bc] = String(b.formatPosition).split(':').map(Number);
  return ar - br || ac - bc;
}

function normalizeSide(team) {
  if (!team) return { formation: [], starters: [], bench: [], injured: [], coach: null };
  const rawPlayers = Array.isArray(team.PLAYERS) ? team.PLAYERS : [];
  const starters = [];
  const bench = [];
  let coach = null;
  for (const raw of rawPlayers) {
    const actual = toInt(raw.PLAYER_POSITION_ACTUAL);
    const player = normalizePlayer(raw);
    if (actual === 10) {
      coach = { id: player.id, name: player.name, image: player.image };
    } else if (player.formatPosition) {
      starters.push(player);
    } else {
      bench.push(player);
    }
  }
  starters.sort(byFormatPosition);
  const injured = (Array.isArray(team.INJURED_SUSPENDED) ? team.INJURED_SUSPENDED : []).map((raw) => ({
    ...normalizePlayer(raw),
    reason: str(raw.PLAYER_STATUS_REASON) || null,
    returnInfo: str(raw.RETURN_INFO) || null,
  }));
  const formation = (Array.isArray(team.STANDING_FORMATIONS) ? team.STANDING_FORMATIONS : [])
    .map(toInt)
    .filter((n) => n !== null);
  return { formation, starters, bench, injured, coach };
}

function normalizeSubstitutions(map, playerNames) {
  const flat = [];
  if (map && typeof map === 'object') {
    for (const period of Object.keys(map).map(Number).sort((a, b) => a - b)) {
      const list = Array.isArray(map[period]) ? map[period] : [];
      for (const raw of list) flat.push(raw);
    }
  }
  const nameOf = (raw) => str(raw.PLAYER_NAME) || joinName(raw);
  const byId = new Map(flat.map((raw) => [str(raw.PLAYER_ID), raw]));
  const lookupName = (id) => {
    const raw = byId.get(id);
    return raw ? nameOf(raw) : playerNames.get(id) || '';
  };

  const result = { home: [], away: [] };
  const seen = new Set();
  const push = (raw, inId, inName, inNum, outId, outNum) => {
    const key = `${raw.NAME}:${raw.MINUTE}:${inId}:${outId}`;
    if (seen.has(key)) return;
    seen.add(key);
    const side = toInt(raw.NAME) === 2 ? 'away' : 'home';
    result[side].push({
      minute: toInt(raw.MINUTE) ?? 0,
      playerIn: { id: inId, name: inName, number: inNum },
      playerOut: { id: outId, name: lookupName(outId), number: outNum },
    });
  };
  for (const raw of flat) {
    if (toInt(raw.INCIDENT_TYPE) === 5) {
      push(raw, str(raw.PLAYER_ID), nameOf(raw), toInt(raw.PNUM), str(raw.OTHER_PLAYER_ID), toInt(raw.PNUM_O));
    }
  }
  for (const raw of flat) {
    if (toInt(raw.INCIDENT_TYPE) === 4) {
      // "off" entry: player = out, OTHER = in. Only used when no matching "on" entry exists.
      const inId = str(raw.OTHER_PLAYER_ID);
      push(raw, inId, lookupName(inId), toInt(raw.PNUM_O), str(raw.PLAYER_ID), toInt(raw.PNUM));
    }
  }
  result.home.sort((a, b) => a.minute - b.minute);
  result.away.sort((a, b) => a.minute - b.minute);
  return result;
}

/** /v1/events/lineups -> Lineups */
function normalizeLineups(json) {
  const d = json && json.DATA;
  if (!d || typeof d !== 'object') return null;
  const teams = Array.isArray(d.LINEUPS) ? d.LINEUPS : [];
  const home = normalizeSide(teams.find((t) => toInt(t.TEAM_NUMBER) === 1));
  const away = normalizeSide(teams.find((t) => toInt(t.TEAM_NUMBER) === 2));
  const playerNames = new Map();
  for (const side of [home, away]) {
    for (const p of [...side.starters, ...side.bench]) playerNames.set(p.id, p.name);
  }
  return { home, away, substitutions: normalizeSubstitutions(d.SUBSTITUTIONS, playerNames) };
}

/* -------------------------------------------------------------- statistics */

/** /v1/events/statistics -> Statistics */
function normalizeStatistics(json) {
  const d = json && json.DATA;
  if (!d || typeof d !== 'object') return null;
  const stats = Array.isArray(d.STATISTICS) ? d.STATISTICS : [];
  const h = stats.find((s) => toInt(s.TEAM_NUMBER) === 1) || {};
  const a = stats.find((s) => toInt(s.TEAM_NUMBER) === 2) || {};
  const rows = [];
  const home = {};
  const away = {};
  for (const [field, key, label, unit] of STAT_FIELDS) {
    const hv = toNum(h[field]);
    const av = toNum(a[field]);
    if (hv === null && av === null) continue;
    const row = { key, label, home: hv ?? 0, away: av ?? 0 };
    if (unit) row.unit = unit;
    rows.push(row);
    home[key] = row.home;
    away[key] = row.away;
  }
  return { rows, home, away };
}

/* --------------------------------------------------------------------- h2h */

/** /v1/events/h2h -> H2H (newest first, max 20) */
function normalizeH2H(json, { limit = 20 } = {}) {
  const d = json && json.DATA;
  const list = d && Array.isArray(d.H2H_EVENTS_KEY) ? d.H2H_EVENTS_KEY : [];
  const matches = list
    .map((ev) => {
      const match = normalizeMatch(ev, ev.STAGE);
      return { ...match, date: match.startTime ? match.startTime.slice(0, 10) : '', winner: winnerFrom(ev.WHICH_TEAM_WON, match.isFinished) };
    })
    .sort((x, y) => str(y.startTime).localeCompare(str(x.startTime)))
    .slice(0, limit);
  return { matches };
}

module.exports = {
  COMPETITION_BADGE_BASE,
  INCIDENT_TYPES,
  PERIOD_LABELS,
  STAT_FIELDS,
  parseUpstreamDate,
  toInt,
  statusInfo,
  winnerFrom,
  normalizeTeam,
  normalizeCompetition,
  normalizeMatch,
  normalizeList,
  normalizeIncidentEntry,
  normalizeIncidents,
  normalizeScoreboard,
  normalizePlayer,
  normalizeLineups,
  normalizeStatistics,
  normalizeH2H,
};
