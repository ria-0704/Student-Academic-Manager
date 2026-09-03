const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

// ── Register ──────────────────────────────────────────────────────────────────
async function register(req, res) {
  const { full_name, email, password, confirm_password } = req.body;

  if (!full_name || !email || !password || !confirm_password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!email.endsWith('@thapar.edu')) {
    return res.status(400).json({ message: 'Only @thapar.edu email addresses are allowed.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [full_name.trim(), email.toLowerCase().trim(), password_hash]
    );

    const token = jwt.sign(
      { id: result.insertId, email: email.toLowerCase().trim(), full_name: full_name.trim() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: result.insertId, full_name: full_name.trim(), email: email.toLowerCase().trim() },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
}

// ── Get current user ──────────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ message: 'Failed to fetch user.' });
  }
}

module.exports = { register, login, getMe };
