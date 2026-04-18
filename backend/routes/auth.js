const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'smartbasket-reset-2026';

// POST /api/auth/signup — creates account with pending status
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return res.status(409).json({ message: 'Email already registered' });

  await User.create({ name, email: email.toLowerCase(), password, status: 'pending' });
  res.status(201).json({ message: 'Request submitted. Your account is pending admin approval.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +status');
  if (!user)
    return res.status(401).json({ message: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: 'Invalid email or password' });

  if (user.status === 'pending')
    return res.status(403).json({ message: 'Your account is pending admin approval. Please wait.' });
  if (user.status === 'rejected')
    return res.status(403).json({ message: 'Your account request was not approved. Contact support.' });

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

// GET /api/auth/admin/pending — list all pending users
router.get('/admin/pending', async (req, res) => {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET)
    return res.status(403).json({ message: 'Forbidden' });
  const users = await User.find({ status: 'pending' }).select('name email createdAt');
  res.json(users);
});

// POST /api/auth/admin/approve/:id — approve a user
router.post('/admin/approve/:id', async (req, res) => {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET)
    return res.status(403).json({ message: 'Forbidden' });
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: `Approved: ${user.email}` });
});

// POST /api/auth/admin/reject/:id — reject a user
router.post('/admin/reject/:id', async (req, res) => {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET)
    return res.status(403).json({ message: 'Forbidden' });
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: `Rejected: ${user.email}` });
});

module.exports = router;
