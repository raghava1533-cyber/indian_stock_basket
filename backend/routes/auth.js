const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return res.status(409).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user)
    return res.status(401).json({ message: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

// GET /api/auth/me  (verify token)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;
