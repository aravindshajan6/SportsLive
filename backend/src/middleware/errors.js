'use strict';

const logger = require('../lib/logger');

/** Error with an HTTP status; `code`/`details` are optional and surfaced to clients. */
class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function errorBody(message, code, extra) {
  const error = { message };
  if (code) error.code = code;
  if (extra) Object.assign(error, extra);
  return { error };
}

function notFound(req, res) {
  res.status(404).json(errorBody(`Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}

function duplicateKeyCode(err) {
  const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
  if (field === 'username') return { code: 'USERNAME_TAKEN', message: 'Username is already taken' };
  if (field === 'email') return { code: 'EMAIL_TAKEN', message: 'Email is already registered' };
  return { code: 'CONFLICT', message: 'Duplicate value' };
}

function isDbUnavailable(err) {
  return (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoNotConnectedError' ||
    (err.name === 'MongooseError' && /bufferCommands|before initial connection/i.test(err.message))
  );
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    const extra = err.details !== undefined ? { details: err.details } : undefined;
    return res.status(err.status).json(errorBody(err.message, err.code, extra));
  }

  if (err.name === 'UpstreamError') {
    return res.status(502).json(errorBody('Upstream error', 'UPSTREAM', { status: err.status ?? null }));
  }

  // body-parser / express.json failures
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(errorBody('Malformed JSON body', 'BAD_JSON'));
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json(errorBody('Request body too large', 'PAYLOAD_TOO_LARGE'));
  }

  // Mongo / Mongoose
  if (err.code === 11000) {
    const { code, message } = duplicateKeyCode(err);
    return res.status(409).json(errorBody(message, code));
  }
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message]));
    return res.status(400).json(errorBody('Validation failed', 'VALIDATION', { details }));
  }
  if (err.name === 'CastError') {
    return res.status(400).json(errorBody(`Invalid value for ${err.path}`, 'VALIDATION'));
  }
  if (isDbUnavailable(err)) {
    logger.error('Database unavailable', err.message);
    return res.status(503).json(errorBody('Database unavailable', 'DB_UNAVAILABLE'));
  }

  // Errors thrown by third-party middleware with an explicit status (e.g. cors)
  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500 && err.expose !== false) {
    return res.status(err.status).json(errorBody(err.message || 'Request error'));
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json(errorBody('Internal server error', 'INTERNAL'));
}

module.exports = { HttpError, notFound, errorHandler };
