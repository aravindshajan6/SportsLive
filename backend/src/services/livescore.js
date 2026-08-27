'use strict';

const { cache, TTL } = require('../lib/cache');
const { livescoreUrl, livescoreGet } = require('../lib/upstream');
const { HttpError } = require('../middleware/errors');
const normalize = require('../lib/normalize');

const COMMON = { sport: 'soccer', locale: 'EN' };

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch an upstream endpoint through the TTL cache (key = URL, in-flight
 * coalescing, stale-on-upstream-failure) and normalize it. `transform`
 * returning null means "no such match" -> 404 (never cached).
 */
function cachedUpstream(pathname, params, ttl, transform) {
  const url = livescoreUrl(pathname, params);
  return cache.wrap(
    url,
    ttl,
    async () => {
      const json = await livescoreGet(url);
      const data = transform(json);
      if (data === null) throw new HttpError(404, 'Match not found', { code: 'NOT_FOUND' });
      return data;
    },
    { staleOnError: (err) => !(err instanceof HttpError) },
  );
}

/** TTL for a day's fixture list: past days never change, today changes often. */
function fixturesTtl(date) {
  const today = todayUtc();
  if (date < today) return TTL.FIXTURES_PAST;
  if (date > today) return TTL.FIXTURES_FUTURE;
  return TTL.FIXTURES_TODAY;
}

/** TTL for match-detail data based on the match phase. */
function ttlForPhase(phase) {
  if (phase === 'finished' || phase === 'postponed' || phase === 'abandoned' || phase === 'cancelled') return TTL.MATCH_FINISHED;
  if (phase === 'upcoming') return TTL.MATCH_UPCOMING;
  return TTL.MATCH_LIVE;
}

/**
 * Lineups/statistics/incidents don't carry a status, so reuse the phase from the (already
 * cached) scoreboard of the same match; fall back to the short TTL when it is unknown.
 */
function detailTtl(id) {
  const scoreboard = cache.get(livescoreUrl('/v1/events/scoreboard', { ...COMMON, event_id: id }));
  return scoreboard ? ttlForPhase(scoreboard.phase) : TTL.MATCH_LIVE;
}

function withMeta(date) {
  return (json) => ({ date, ...normalize.normalizeList(json), fetchedAt: new Date().toISOString() });
}

function getLive() {
  return cachedUpstream('/v1/events/live', { ...COMMON, timezone: 0 }, TTL.LIVE, withMeta(todayUtc()));
}

function getByDate(date = todayUtc()) {
  return cachedUpstream('/v1/events/list', { ...COMMON, date, timezone: 0 }, fixturesTtl(date), withMeta(date));
}

function getScoreboard(id) {
  return cachedUpstream('/v1/events/scoreboard', { ...COMMON, event_id: id }, (m) => ttlForPhase(m && m.phase), normalize.normalizeScoreboard);
}

function getLineups(id) {
  return cachedUpstream('/v1/events/lineups', { ...COMMON, event_id: id }, () => detailTtl(id), normalize.normalizeLineups);
}

function getStatistics(id) {
  return cachedUpstream('/v1/events/statistics', { ...COMMON, event_id: id }, () => detailTtl(id), normalize.normalizeStatistics);
}

function getIncidents(id) {
  return cachedUpstream('/v1/events/incidents', { ...COMMON, event_id: id }, () => detailTtl(id), normalize.normalizeIncidents);
}

function getH2H(id) {
  return cachedUpstream('/v1/events/h2h', { ...COMMON, event_id: id }, TTL.H2H, normalize.normalizeH2H);
}

module.exports = { todayUtc, getLive, getByDate, getScoreboard, getLineups, getStatistics, getIncidents, getH2H };
