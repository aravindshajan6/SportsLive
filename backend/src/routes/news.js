'use strict';

const { Router } = require('express');
const { z } = require('zod');
const news = require('../services/news');
const { validate } = require('../middleware/validate');

const router = Router();

const newsQuery = z.object({
  source: z.enum(['all', ...news.SOURCE_KEYS]).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

router.get('/', validate({ query: newsQuery }), async (req, res) => {
  res.json(await news.getNews(req.valid.query));
});

module.exports = router;
