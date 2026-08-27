'use strict';

const { rateLimit } = require('express-rate-limit');

function createLimiter({ windowMs, limit, message = 'Too many requests, please slow down' }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: { message, code: 'RATE_LIMITED' } });
    },
  });
}

const globalLimiter = createLimiter({ windowMs: 60 * 1000, limit: 120 });
const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 20, message: 'Too many authentication attempts, try again later' });
const contactLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 5, message: 'Too many messages sent, try again later' });

module.exports = { createLimiter, globalLimiter, authLimiter, contactLimiter };
