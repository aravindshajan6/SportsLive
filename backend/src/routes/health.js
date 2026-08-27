'use strict';

const { Router } = require('express');
const db = require('../config/db');
const { quota } = require('../lib/upstream');
const { cache } = require('../lib/cache');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    db: db.state(),
    time: new Date().toISOString(),
    upstreamQuota: quota.updatedAt ? quota : null, // RapidAPI monthly request budget (null until first upstream call)
    cacheEntries: cache.size,
  });
});

module.exports = router;
