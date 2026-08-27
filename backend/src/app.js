'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const logger = require('./lib/logger');
const { globalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

// Render/Netlify sit behind one proxy; needed for correct client IPs in rate limiting.
app.set('trust proxy', env.isProd ? 1 : false);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.length
      ? (origin, cb) => {
          const allowed = !origin || env.CORS_ORIGINS.includes(env.normalizeOrigin(origin));
          if (!allowed) logger.warn(`CORS: origin ${origin} not in CORS_ORIGINS [${env.CORS_ORIGINS.join(', ')}]`);
          cb(null, allowed);
        }
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
);
if (!env.isProd && !env.isTest) app.use(morgan('dev'));
app.use(express.json({ limit: '50kb' }));

app.get('/', (req, res) => {
  res.json({ name: 'Sportscast API', version: '2.0.0', health: '/api/health' });
});

app.use('/api', globalLimiter);
app.use('/api/health', require('./routes/health'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/users', require('./routes/users'));
app.use('/api/news', require('./routes/news'));
app.use('/api/contact', require('./routes/contact'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
