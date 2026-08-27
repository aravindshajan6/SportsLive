'use strict';

const env = require('./src/config/env');
const logger = require('./src/lib/logger');
const db = require('./src/config/db');
const app = require('./src/app');

// Connect in the background: the API must serve match/news routes even while MongoDB is down.
db.connect();

const server = app.listen(env.PORT, () => {
  logger.info(`SportsLive API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  logger.info(`${signal} received, shutting down`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  server.close(async () => {
    try {
      await db.disconnect();
    } catch (err) {
      logger.error('Error during MongoDB disconnect', err.message);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => logger.error('Unhandled promise rejection', err));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  shutdown('uncaughtException');
});
