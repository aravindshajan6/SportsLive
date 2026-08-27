'use strict';

/**
 * Tiny logger wrapper so the rest of the code base never calls console.* directly.
 * Level is controlled by LOG_LEVEL (debug|info|warn|error|silent); defaults to
 * debug in development, info in production and silent under tests.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function threshold() {
  const explicit = process.env.LOG_LEVEL;
  if (explicit && LEVELS[explicit] != null) return LEVELS[explicit];
  if (process.env.NODE_ENV === 'test') return LEVELS.silent;
  if (process.env.NODE_ENV === 'production') return LEVELS.info;
  return LEVELS.debug;
}

function format(level, message, meta) {
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${message}`;
  if (meta === undefined) return line;
  if (meta instanceof Error) return `${line} ${meta.stack || meta.message}`;
  try {
    return `${line} ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  } catch {
    return `${line} ${String(meta)}`;
  }
}

function log(level, message, meta) {
  if (LEVELS[level] < threshold()) return;
  const out = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  out.write(`${format(level, message, meta)}\n`);
}

module.exports = {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
