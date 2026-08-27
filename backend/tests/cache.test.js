'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers');
const { TtlCache } = require('../src/lib/cache');

describe('TtlCache', () => {
  test('caches values for the ttl and coalesces concurrent producers', async () => {
    const cache = new TtlCache({ sweepIntervalMs: 0 });
    let calls = 0;
    const producer = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 10));
      return { calls };
    };
    const [a, b] = await Promise.all([cache.wrap('k', 1000, producer), cache.wrap('k', 1000, producer)]);
    assert.equal(calls, 1);
    assert.equal(a, b);
    assert.equal(await cache.wrap('k', 1000, producer), a);
    assert.equal(calls, 1);
  });

  test('expires entries and serves stale data when the producer fails', async () => {
    const cache = new TtlCache({ sweepIntervalMs: 0 });
    cache.set('k', 'old', -1); // already expired
    assert.equal(cache.get('k'), undefined);
    const failing = async () => {
      throw new Error('boom');
    };
    assert.equal(await cache.wrap('k', 1000, failing), 'old');
    await assert.rejects(cache.wrap('missing', 1000, failing), /boom/);
    await assert.rejects(cache.wrap('k', 1000, failing, { staleOnError: false }), /boom/);
  });

  test('evicts the oldest entry when full', () => {
    const cache = new TtlCache({ maxEntries: 2, sweepIntervalMs: 0 });
    cache.set('a', 1, 1000);
    cache.set('b', 2, 1000);
    cache.set('c', 3, 1000);
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('c'), 3);
    assert.equal(cache.size, 2);
  });
});
