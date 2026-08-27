'use strict';

const logger = require('./logger');

/**
 * Minimal in-memory TTL cache with request coalescing and stale-on-error.
 * Keys are arbitrary strings (upstream URLs in practice).
 */
class TtlCache {
  constructor({ maxEntries = 1000, sweepIntervalMs = 5 * 60 * 1000 } = {}) {
    this.store = new Map();
    this.inflight = new Map();
    this.maxEntries = maxEntries;
    if (sweepIntervalMs > 0) {
      this.sweeper = setInterval(() => this.sweep(), sweepIntervalMs);
      this.sweeper.unref();
    }
  }

  /** Fresh value or undefined. */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.value;
  }

  /** Raw entry ({ value, storedAt, expiresAt }) even if stale. */
  peek(key) {
    return this.store.get(key);
  }

  set(key, value, ttlMs) {
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      // Map preserves insertion order: evict the oldest entry.
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    const now = Date.now();
    this.store.set(key, { value, storedAt: now, expiresAt: now + ttlMs });
    return value;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.inflight.clear();
  }

  get size() {
    return this.store.size;
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  /**
   * Return the cached value for `key` or produce it with `producer`.
   * Identical concurrent calls share one in-flight promise. When the producer
   * fails and a stale entry exists, the stale value is returned instead.
   */
  async wrap(key, ttlMs, producer, { staleOnError = true } = {}) {
    const fresh = this.get(key);
    if (fresh !== undefined) return fresh;
    if (this.inflight.has(key)) return this.inflight.get(key);

    const promise = (async () => {
      try {
        const value = await producer();
        // `ttlMs` may be a function of the produced value (e.g. finished matches cache much longer)
        const ttl = typeof ttlMs === 'function' ? ttlMs(value) : ttlMs;
        this.set(key, value, ttl);
        return value;
      } catch (err) {
        const stale = this.store.get(key);
        const allowStale = typeof staleOnError === 'function' ? staleOnError(err) : staleOnError;
        if (stale && allowStale) {
          logger.warn(`Serving stale cache entry after upstream failure: ${key}`, err.message);
          return stale.value;
        }
        throw err;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
// The RapidAPI free plan allows only ~500 upstream requests/month, so anything that cannot
// change any more (finished matches, past days) is cached for a long time.
const TTL = Object.freeze({
  LIVE: 1 * MIN,
  FIXTURES_TODAY: 5 * MIN,
  FIXTURES_PAST: 24 * HOUR,
  FIXTURES_FUTURE: 6 * HOUR,
  MATCH_LIVE: 1 * MIN, // scoreboard / lineups / statistics / incidents while in play
  MATCH_UPCOMING: 10 * MIN,
  MATCH_FINISHED: 24 * HOUR,
  H2H: 24 * HOUR,
  NEWS: 10 * MIN,
  // legacy aliases
  FIXTURES: 5 * MIN,
  SCOREBOARD: 1 * MIN,
  DETAIL: 1 * MIN,
});

module.exports = { TtlCache, TTL, cache: new TtlCache() };
