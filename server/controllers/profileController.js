const db = require('../db/connection');

async function getProfile(req, res) {
  try {
    const [rows] = await db.query('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch profile.' });
  }
}

async function updateProfile(req, res) {
  const { full_name } = req.body;
  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
  }

  try {
    await db.query('UPDATE users SET full_name = ? WHERE id = ?', [full_name.trim(), req.user.id]);
    const [rows] = await db.query('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    return res.json({ message: 'Profile updated.', user: rows[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
}

module.exports = { getProfile, updateProfile };
