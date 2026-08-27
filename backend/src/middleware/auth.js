'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const { HttpError } = require('./errors');

const TOKEN_TTL = '7d';

function signToken(user) {
  return jwt.sign({ sub: String(user._id), username: user.username }, env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/** Requires `Authorization: Bearer <jwt>`; sets req.auth = { userId, username }. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!/^Bearer$/i.test(scheme) || !token) {
    return next(new HttpError(401, 'Authentication required', { code: 'UNAUTHENTICATED' }));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.auth = { userId: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return next(new HttpError(401, message, { code: 'UNAUTHENTICATED' }));
  }
}

/** Short-circuits DB-backed routes with 503 while MongoDB is unreachable. */
function requireDb(req, res, next) {
  if (!db.isConnected()) {
    return next(new HttpError(503, 'Database unavailable', { code: 'DB_UNAVAILABLE' }));
  }
  return next();
}

module.exports = { signToken, requireAuth, requireDb, TOKEN_TTL };
