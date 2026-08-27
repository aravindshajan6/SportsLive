// Shared matches data hook + pure helpers (grouping, sorting, filtering, featured pick).
import { useCallback, useMemo } from 'react';
import { matchesApi } from '@/lib/api.js';
import { useFetch } from '@/hooks/useFetch.js';
import { toISODate } from '@/lib/format.js';

export const LIVE_POLL_MS = 60_000;
const FIXTURES_POLL_MS = 5 * 60_000;

/* ------------------------------------------------------------ priority */

// Big competitions first. Names repeat across countries ("Premier League" exists in
// England, Egypt, Kuwait…) so the country must match too.
const PRIORITY = [
  (c) => /^premier league$/i.test(c.name) && /england/i.test(c.country),
  (c) => /^la ?liga$/i.test(c.name) && /spain/i.test(c.country),
  (c) => /^serie a$/i.test(c.name) && /italy/i.test(c.country),
  (c) => /^bundesliga$/i.test(c.name) && /germany/i.test(c.country),
  (c) => /^ligue 1$/i.test(c.name) && /france/i.test(c.country),
  (c) => /^(uefa )?champions league$/i.test(c.name) && /uefa|europe|champions/i.test(c.country),
  (c) => /^(uefa )?europa league$/i.test(c.name) && /uefa|europe|europa/i.test(c.country),
];

export function competitionRank(competition) {
  if (!competition) return PRIORITY.length;
  const c = { name: competition.name || '', country: competition.country || '' };
  const idx = PRIORITY.findIndex((test) => test(c));
  return idx === -1 ? PRIORITY.length : idx;
}

export const isPriorityCompetition = (competition) => competitionRank(competition) < PRIORITY.length;

export function compareCompetitions(a, b) {
  const ra = competitionRank(a);
  const rb = competitionRank(b);
  if (ra !== rb) return ra - rb;
  return (a.country || '').localeCompare(b.country || '') || (a.name || '').localeCompare(b.name || '');
}

const time = (m) => {
  const t = new Date(m.startTime).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export function compareMatches(a, b) {
  return time(a) - time(b) || (a.home?.name || '').localeCompare(b.home?.name || '');
}

/* ------------------------------------------------------------ grouping */

/** Flat Match[] → CompetitionGroup[] (sorted by priority, matches sorted by kickoff). */
export function groupMatches(matches = []) {
  const map = new Map();
  for (const m of matches) {
    const c = m.competition || {};
    const key = c.id || `${c.country}|${c.name}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: c.name || 'Other',
        country: c.country || '',
        stageName: c.stageName || '',
        color: c.color || null,
        isCup: Boolean(c.isCup),
        badge: c.badge || null,
        matches: [],
      });
    }
    map.get(key).matches.push(m);
  }
  const groups = Array.from(map.values());
  groups.forEach((g) => g.matches.sort(compareMatches));
  groups.sort(compareCompetitions);
  return groups;
}

/** Merge the live feed into the day's fixtures — live data wins, unseen live matches are appended. */
export function mergeLive(base = [], live = []) {
  if (!live.length) return base;
  const liveById = new Map(live.map((m) => [m.id, m]));
  const seen = new Set();
  const merged = base.map((m) => {
    seen.add(m.id);
    return liveById.get(m.id) ?? m;
  });
  live.forEach((m) => {
    if (!seen.has(m.id)) merged.push(m);
  });
  return merged;
}

export function countMatches(matches = []) {
  const counts = { all: matches.length, live: 0, upcoming: 0, finished: 0 };
  for (const m of matches) {
    if (m.isLive) counts.live += 1;
    else if (m.phase === 'upcoming') counts.upcoming += 1;
    else if (m.isFinished || m.phase === 'finished') counts.finished += 1;
  }
  return counts;
}

export function filterMatches(matches = [], { filter = 'all', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return matches.filter((m) => {
    if (filter === 'live' && !m.isLive) return false;
    if (filter === 'upcoming' && m.phase !== 'upcoming') return false;
    if (filter === 'finished' && !(m.isFinished || m.phase === 'finished')) return false;
    if (!q) return true;
    const hay = [m.home?.name, m.away?.name, m.home?.abbr, m.away?.abbr, m.competition?.name, m.competition?.country]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

const goals = (m) => (m.homeScore ?? 0) + (m.awayScore ?? 0);

/**
 * Pick the match to feature on the home page.
 * live with most goals → next upcoming big fixture → next upcoming → latest big result → latest result.
 */
export function pickFeaturedMatch(matches = [], now = Date.now()) {
  if (!matches.length) return null;
  const live = matches.filter((m) => m.isLive);
  if (live.length) {
    const best = [...live].sort(
      (a, b) => goals(b) - goals(a) || competitionRank(a.competition) - competitionRank(b.competition) || compareMatches(a, b),
    )[0];
    return { match: best, reason: 'live' };
  }
  const upcoming = matches.filter((m) => m.phase === 'upcoming' && time(m) >= now - 5 * 60_000).sort(compareMatches);
  const bigUpcoming = upcoming.find((m) => isPriorityCompetition(m.competition));
  if (bigUpcoming) return { match: bigUpcoming, reason: 'upcoming' };
  if (upcoming.length) return { match: upcoming[0], reason: 'upcoming' };
  const finished = matches.filter((m) => m.isFinished || m.phase === 'finished').sort((a, b) => compareMatches(b, a));
  const bigFinished = finished.find((m) => isPriorityCompetition(m.competition));
  if (bigFinished) return { match: bigFinished, reason: 'finished' };
  if (finished.length) return { match: finished[0], reason: 'finished' };
  return null;
}

/* ------------------------------------------------------------ hook */

/**
 * Fixtures for a day (+ live feed merged in when the day is today, polled every 60s).
 * @param {string} [date] YYYY-MM-DD (local). Defaults to today.
 */
export function useMatches(date) {
  const today = toISODate();
  const day = date || today;
  const isToday = day === today;

  const fixtures = useFetch((signal) => matchesApi.byDate(day, signal), {
    deps: [day],
    pollMs: isToday ? FIXTURES_POLL_MS : 0,
  });
  const live = useFetch((signal) => matchesApi.live(signal), {
    deps: ['live'],
    enabled: isToday,
    pollMs: LIVE_POLL_MS,
  });

  const fixtureList = fixtures.data?.matches;
  const liveList = live.data?.matches;
  const matches = useMemo(() => mergeLive(fixtureList ?? [], isToday ? liveList ?? [] : []), [fixtureList, liveList, isToday]);
  const groups = useMemo(() => groupMatches(matches), [matches]);
  const counts = useMemo(() => countMatches(matches), [matches]);

  const refetchFixtures = fixtures.refetch;
  const refetchLive = live.refetch;
  const refetch = useCallback(() => {
    refetchFixtures();
    if (isToday) refetchLive();
  }, [refetchFixtures, refetchLive, isToday]);

  const updatedAt = Math.max(fixtures.updatedAt ?? 0, isToday ? live.updatedAt ?? 0 : 0) || null;
  const hasData = fixtures.data != null || (isToday && live.data != null);

  return {
    date: day,
    isToday,
    matches,
    groups,
    counts,
    loading: !hasData && (fixtures.loading || (isToday && live.loading)),
    refreshing: fixtures.refreshing || live.refreshing,
    // Fixtures error is the blocking one; live-only failures degrade silently.
    error: fixtures.error,
    liveError: isToday ? live.error : null,
    updatedAt,
    refetch,
  };
}
