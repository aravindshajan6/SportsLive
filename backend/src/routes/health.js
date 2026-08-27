'use strict';

const { Router } = require('express');
const db = require('../config/db');

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), db: db.state(), time: new Date().toISOString() });
});

module.exports = router;
