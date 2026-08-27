'use strict';

const { Router } = require('express');
const { z } = require('zod');
const Contact = require('../models/Contact');
const { validate } = require('../middleware/validate');
const { requireDb } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimit');

const router = Router();

const contactBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().max(254).toLowerCase().pipe(z.email({ error: 'Invalid email address' })),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

router.post('/', contactLimiter, validate({ body: contactBody }), requireDb, async (req, res) => {
  await Contact.create(req.body);
  res.status(201).json({ ok: true });
});

module.exports = router;
