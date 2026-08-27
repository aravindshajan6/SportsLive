'use strict';

const { Router } = require('express');
const { z } = require('zod');
const User = require('../models/User');
const { validate } = require('../middleware/validate');
const { requireAuth, requireDb, signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { HttpError } = require('../middleware/errors');

const router = Router();

const CI = { locale: 'en', strength: 2 }; // case-insensitive collation for username lookups

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(24, 'Username must be at most 24 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores');
const emailSchema = z.string().trim().max(254).toLowerCase().pipe(z.email({ error: 'Invalid email address' }));
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password must be at most 72 characters');

const signupBody = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema });
const loginBody = z.object({
  identifier: z.string().trim().min(1, 'Username or email is required').max(254),
  password: z.string().min(1, 'Password is required').max(72),
});

/** Throws 409 when username/email is already used by another account. */
async function assertAvailable({ username, email }, excludeId) {
  if (username) {
    const query = User.findOne({ username }).collation(CI);
    if (excludeId) query.where('_id').ne(excludeId);
    if (await query) throw new HttpError(409, 'Username is already taken', { code: 'USERNAME_TAKEN' });
  }
  if (email) {
    const query = User.findOne({ email });
    if (excludeId) query.where('_id').ne(excludeId);
    if (await query) throw new HttpError(409, 'Email is already registered', { code: 'EMAIL_TAKEN' });
  }
}

router.post('/signup', authLimiter, validate({ body: signupBody }), requireDb, async (req, res) => {
  const { username, email, password } = req.body;
  await assertAvailable({ username, email });
  const user = await User.create({ username, email, passwordHash: await User.hashPassword(password) });
  res.status(201).json({ user: user.toPublic(), token: signToken(user) });
});

router.post('/login', authLimiter, validate({ body: loginBody }), requireDb, async (req, res) => {
  const { identifier, password } = req.body;
  const user = identifier.includes('@')
    ? await User.findOne({ email: identifier.toLowerCase() })
    : await User.findOne({ username: identifier }).collation(CI);
  const ok = user ? await user.comparePassword(password) : false;
  if (!ok) throw new HttpError(401, 'Invalid credentials', { code: 'INVALID_CREDENTIALS' });
  res.json({ user: user.toPublic(), token: signToken(user) });
});

router.get('/me', requireAuth, requireDb, async (req, res) => {
  const user = await User.findById(req.auth.userId);
  if (!user) throw new HttpError(401, 'User no longer exists', { code: 'UNAUTHENTICATED' });
  res.json({ user: user.toPublic() });
});

module.exports = { router, schemas: { usernameSchema, emailSchema, passwordSchema }, assertAvailable };
