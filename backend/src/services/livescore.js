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

function withMeta(date) {
  return (json) => ({ date, ...normalize.normalizeList(json), fetchedAt: new Date().toISOString() });
}

function getLive() {
  return cachedUpstream('/v1/events/live', { ...COMMON, timezone: 0 }, TTL.LIVE, withMeta(todayUtc()));
}

function getByDate(date = todayUtc()) {
  return cachedUpstream('/v1/events/list', { ...COMMON, date, timezone: 0 }, TTL.FIXTURES, withMeta(date));
}

function getScoreboard(id) {
  return cachedUpstream('/v1/events/scoreboard', { ...COMMON, event_id: id }, TTL.SCOREBOARD, normalize.normalizeScoreboard);
}

function getLineups(id) {
  return cachedUpstream('/v1/events/lineups', { ...COMMON, event_id: id }, TTL.DETAIL, normalize.normalizeLineups);
}

function getStatistics(id) {
  return cachedUpstream('/v1/events/statistics', { ...COMMON, event_id: id }, TTL.DETAIL, normalize.normalizeStatistics);
}

function getIncidents(id) {
  return cachedUpstream('/v1/events/incidents', { ...COMMON, event_id: id }, TTL.DETAIL, normalize.normalizeIncidents);
}

function getH2H(id) {
  return cachedUpstream('/v1/events/h2h', { ...COMMON, event_id: id }, TTL.H2H, normalize.normalizeH2H);
}

module.exports = { todayUtc, getLive, getByDate, getScoreboard, getLineups, getStatistics, getIncidents, getH2H };
