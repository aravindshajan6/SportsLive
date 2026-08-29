'use strict';

const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const logger = require('../lib/logger');

// Always load backend/.env regardless of the process cwd.
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

/** Normalize an origin so "Example.com/", "https://example.com" and " example.com " all match. */
function normalizeOrigin(value) {
  let s = String(value || '').trim().toLowerCase();
  if (!s) return '';
  if (!/^https?:\/\//.test(s)) s = `https://${s}`;
  try {
    return new URL(s).origin; // scheme + host (+ port), no path or trailing slash
  } catch {
    return s.replace(/\/+$/, '');
  }
}

function parseList(value) {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s !== '*')
    .map(normalizeOrigin)
    .filter(Boolean);
}

/**
 * How many reverse-proxy hops to trust when resolving req.ip (rate-limit keying).
 * Render puts exactly one proxy in front: 1. The VPS is Traefik -> nginx -> here: 2.
 * Getting this too low collapses every visitor onto a single rate-limit bucket.
 */
function parseTrustProxy(value) {
  if (value === undefined || value === '') return isProd ? 1 : false;
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return value; // also allows 'loopback', a CIDR, or a comma list
}

// Backwards compatibility: the Render deployment still defines the legacy names.
const MONGO_URI = process.env.MONGO_URI || process.env.mongoAtlasURI || '';
let JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || '';

if (!JWT_SECRET) {
  if (isProd) {
    throw new Error('JWT_SECRET is required in production (set JWT_SECRET in the environment)');
  }
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  if (!isTest) logger.warn('JWT_SECRET not set: using a random secret; tokens will not survive a restart');
}
if (!process.env.RAPIDAPI_KEY && !isTest) {
  logger.warn('RAPIDAPI_KEY not set: /api/matches routes will fail with UPSTREAM errors');
}
if (!MONGO_URI && !isTest) {
  logger.warn('MONGO_URI not set: auth, comments and contact routes will respond 503 DB_UNAVAILABLE');
}

module.exports = Object.freeze({
  normalizeOrigin,
  NODE_ENV,
  isProd,
  isTest,
  PORT: Number(process.env.PORT) || 4000,
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
  MONGO_URI,
  JWT_SECRET,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '',
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || 'livescore-sports.p.rapidapi.com',
  /** Allowed CORS origins; an empty list means "*" (allow any origin). */
  CORS_ORIGINS: parseList(process.env.CORS_ORIGINS),
  DB_SERVER_SELECTION_TIMEOUT_MS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  UPSTREAM_TIMEOUT_MS: Number(process.env.UPSTREAM_TIMEOUT_MS) || 12000,
});
