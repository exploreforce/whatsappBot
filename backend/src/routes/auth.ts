import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../models/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, name, preferredLanguage } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const existing = await db('users').where({ email }).first();
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const accountId = uuidv4();
  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  await db('accounts').insert({ id: accountId, name, created_at: new Date(), updated_at: new Date() });
  await db('users').insert({
    id: userId,
    account_id: accountId,
    email,
    password_hash: passwordHash,
    preferred_language: preferredLanguage || 'de',
    created_at: new Date(),
    updated_at: new Date(),
  });
  await db('account_members').insert({ id: uuidv4(), account_id: accountId, user_id: userId, role: 'owner', created_at: new Date() });

  const token = jwt.sign({ userId, accountId }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.status(201).json({ token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await db('users').where({ email }).first();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id, accountId: user.account_id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({ token });
});

export default router;


