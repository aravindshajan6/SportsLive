'use strict';

const env = require('../config/env');
const logger = require('./logger');
const { HttpError } = require('../middleware/errors');

class UpstreamError extends Error {
  constructor(message, { status, url, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'UpstreamError';
    this.status = status;
    this.url = url;
  }
}

/** fetch() with an AbortController timeout (default 12s). */
async function fetchWithTimeout(url, { headers = {}, timeoutMs = env.UPSTREAM_TIMEOUT_MS, method = 'GET' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method, headers, signal: controller.signal });
  } catch (err) {
    const timedOut = err.name === 'AbortError';
    throw new UpstreamError(timedOut ? 'Upstream timeout' : 'Upstream unreachable', { url, cause: err });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options) {
  const res = await fetchWithTimeout(url, options);
  if (!res.ok) {
    logger.warn(`Upstream ${res.status} for ${url}`);
    throw new UpstreamError('Upstream error', { status: res.status, url });
  }
  try {
    return await res.json();
  } catch (err) {
    throw new UpstreamError('Upstream returned invalid JSON', { status: res.status, url, cause: err });
  }
}

function livescoreUrl(pathname, params = {}) {
  const url = new URL(pathname, `https://${env.RAPIDAPI_HOST}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** GET a LiveScore (RapidAPI) endpoint by absolute URL. */
async function livescoreGet(url) {
  if (!env.RAPIDAPI_KEY) {
    throw new HttpError(500, 'RAPIDAPI_KEY is not configured', { code: 'CONFIG' });
  }
  logger.debug(`Upstream GET ${url}`);
  return fetchJson(url, {
    headers: {
      'X-RapidAPI-Key': env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': env.RAPIDAPI_HOST,
      Accept: 'application/json',
    },
  });
}

module.exports = { UpstreamError, fetchWithTimeout, fetchJson, livescoreUrl, livescoreGet };
