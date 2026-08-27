'use strict';

const { Router } = require('express');
const { z } = require('zod');
const livescore = require('../services/livescore');
const { validate } = require('../middleware/validate');
const { requireAuth, requireDb } = require('../middleware/auth');
const { HttpError } = require('../middleware/errors');
const Comment = require('../models/Comment');
const User = require('../models/User');

const router = Router();

const idParams = z.object({ id: z.string().regex(/^\d+$/, 'Match id must be numeric') });

const dateQuery = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d), 'Invalid date')
    .optional(),
});

const commentBody = z.object({ text: z.string().trim().min(1, 'Comment cannot be empty').max(500, 'Comment must be 500 characters or fewer') });

router.get('/live', async (req, res) => {
  res.json(await livescore.getLive());
});

router.get('/', validate({ query: dateQuery }), async (req, res) => {
  res.json(await livescore.getByDate(req.valid.query.date || livescore.todayUtc()));
});

router.get('/:id', validate({ params: idParams }), async (req, res) => {
  res.json(await livescore.getScoreboard(req.valid.params.id));
});

router.get('/:id/lineups', validate({ params: idParams }), async (req, res) => {
  res.json(await livescore.getLineups(req.valid.params.id));
});

router.get('/:id/statistics', validate({ params: idParams }), async (req, res) => {
  res.json(await livescore.getStatistics(req.valid.params.id));
});

router.get('/:id/incidents', validate({ params: idParams }), async (req, res) => {
  res.json(await livescore.getIncidents(req.valid.params.id));
});

router.get('/:id/h2h', validate({ params: idParams }), async (req, res) => {
  res.json(await livescore.getH2H(req.valid.params.id));
});

router.get('/:id/comments', validate({ params: idParams }), requireDb, async (req, res) => {
  const comments = await Comment.find({ matchId: req.valid.params.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ comments: comments.map((c) => c.toPublic()) });
});

router.post('/:id/comments', validate({ params: idParams, body: commentBody }), requireAuth, requireDb, async (req, res) => {
  const user = await User.findById(req.auth.userId);
  if (!user) throw new HttpError(401, 'User no longer exists', { code: 'UNAUTHENTICATED' });
  const comment = await Comment.create({
    matchId: req.valid.params.id,
    user: user._id,
    username: user.username,
    text: req.body.text,
  });
  res.status(201).json({ comment: comment.toPublic() });
});

module.exports = router;
