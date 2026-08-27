'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../lib/logger');

// Fail fast instead of queueing queries for 10s while the database is down;
// DB-backed routes are additionally guarded by the requireDb middleware.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

const RETRY_DELAY_MS = 15000;
let retryTimer = null;
let shuttingDown = false;

mongoose.connection.on('connected', () => logger.info('MongoDB connected', { host: mongoose.connection.host }));
mongoose.connection.on('disconnected', () => {
  if (!shuttingDown) logger.warn('MongoDB disconnected');
});
mongoose.connection.on('error', (err) => logger.error('MongoDB error', err.message));

function isConnected() {
  return mongoose.connection.readyState === 1;
}

function state() {
  return isConnected() ? 'connected' : 'disconnected';
}

/**
 * Models are compiled before the connection exists and `bufferCommands` is off,
 * so Mongoose's automatic index build is skipped; build the schema indexes
 * (unique username/email, comment lookups) explicitly once connected.
 */
async function ensureIndexes() {
  for (const name of mongoose.modelNames()) {
    try {
      await mongoose.model(name).createIndexes();
    } catch (err) {
      logger.error(`Failed to build indexes for ${name}: ${err.message}`);
    }
  }
}

/**
 * Connect to MongoDB. Never throws: the HTTP server must start even when the
 * database is unreachable. Retries in the background until it succeeds.
 */
async function connect({ retry = true } = {}) {
  if (!env.MONGO_URI) return false;
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
    });
    await ensureIndexes();
    return true;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    if (retry && !shuttingDown) {
      logger.info(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s`);
      retryTimer = setTimeout(() => connect({ retry }), RETRY_DELAY_MS);
      retryTimer.unref();
    }
    return false;
  }
}

async function disconnect() {
  shuttingDown = true;
  if (retryTimer) clearTimeout(retryTimer);
  await mongoose.disconnect();
}

module.exports = { connect, disconnect, isConnected, state, mongoose };
