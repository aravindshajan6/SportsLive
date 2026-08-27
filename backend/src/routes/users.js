'use strict';

const { Router } = require('express');
const { z } = require('zod');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { validate } = require('../middleware/validate');
const { requireAuth, requireDb, signToken } = require('../middleware/auth');
const { HttpError } = require('../middleware/errors');
const { schemas, assertAvailable } = require('./auth');

const router = Router();
router.use(requireAuth, requireDb);

const updateBody = z
  .object({
    username: schemas.usernameSchema.optional(),
    email: schemas.emailSchema.optional(),
    currentPassword: z.string().max(72).optional(),
    newPassword: schemas.passwordSchema.optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: 'currentPassword is required to set a new password',
    path: ['currentPassword'],
  })
  .refine((d) => d.username || d.email || d.newPassword, { message: 'Nothing to update', path: ['username'] });

router.put('/me', validate({ body: updateBody }), async (req, res) => {
  const user = await User.findById(req.auth.userId);
  if (!user) throw new HttpError(401, 'User no longer exists', { code: 'UNAUTHENTICATED' });
  const { username, email, currentPassword, newPassword } = req.body;

  if (newPassword) {
    if (!(await user.comparePassword(currentPassword))) {
      throw new HttpError(400, 'Current password is incorrect', { code: 'INVALID_CURRENT_PASSWORD' });
    }
    user.passwordHash = await User.hashPassword(newPassword);
  }
  const changes = {};
  if (username && username !== user.username) changes.username = username;
  if (email && email !== user.email) changes.email = email;
  await assertAvailable(changes, user._id);
  Object.assign(user, changes);
  await user.save();

  if (changes.username) {
    await Comment.updateMany({ user: user._id }, { $set: { username: user.username } });
  }
  res.json({ user: user.toPublic(), token: signToken(user) });
});

router.get('/me/comments', async (req, res) => {
  const comments = await Comment.find({ user: req.auth.userId }).sort({ createdAt: -1 }).limit(200);
  res.json({ comments: comments.map((c) => c.toPublic()) });
});

module.exports = router;
