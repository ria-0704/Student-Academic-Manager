const db = require('../db/connection');

// GET /api/units?subject_id=X
async function getUnits(req, res) {
  const { subject_id } = req.query;
  if (!subject_id) return res.status(400).json({ message: 'subject_id is required.' });

  try {
    // Verify subject belongs to user
    const [subCheck] = await db.query('SELECT id FROM subjects WHERE id = ? AND user_id = ?', [subject_id, req.user.id]);
    if (subCheck.length === 0) return res.status(404).json({ message: 'Subject not found.' });

    const [units] = await db.query(
      'SELECT * FROM units WHERE subject_id = ? AND user_id = ? ORDER BY unit_number ASC',
      [subject_id, req.user.id]
    );
    return res.json({ units });
  } catch (err) {
    console.error('getUnits error:', err);
    return res.status(500).json({ message: 'Failed to fetch units.' });
  }
}

// POST /api/units
async function createUnit(req, res) {
  const { subject_id, unit_number, title, description } = req.body;
  if (!subject_id || !unit_number || !title) {
    return res.status(400).json({ message: 'subject_id, unit_number and title are required.' });
  }

  try {
    const [subCheck] = await db.query('SELECT id FROM subjects WHERE id = ? AND user_id = ?', [subject_id, req.user.id]);
    if (subCheck.length === 0) return res.status(404).json({ message: 'Subject not found.' });

    const [result] = await db.query(
      'INSERT INTO units (subject_id, user_id, unit_number, title, description) VALUES (?, ?, ?, ?, ?)',
      [subject_id, req.user.id, unit_number, title.trim(), description ? description.trim() : null]
    );
    const [rows] = await db.query('SELECT * FROM units WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Unit created.', unit: rows[0] });
  } catch (err) {
    console.error('createUnit error:', err);
    return res.status(500).json({ message: 'Failed to create unit.' });
  }
}

// PUT /api/units/:id
async function updateUnit(req, res) {
  const { unit_number, title, description } = req.body;
  if (!unit_number || !title) return res.status(400).json({ message: 'unit_number and title are required.' });

  try {
    const [check] = await db.query('SELECT id FROM units WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Unit not found.' });

    await db.query(
      'UPDATE units SET unit_number = ?, title = ?, description = ? WHERE id = ? AND user_id = ?',
      [unit_number, title.trim(), description ? description.trim() : null, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM units WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Unit updated.', unit: rows[0] });
  } catch (err) {
    console.error('updateUnit error:', err);
    return res.status(500).json({ message: 'Failed to update unit.' });
  }
}

// DELETE /api/units/:id
async function deleteUnit(req, res) {
  try {
    const [check] = await db.query('SELECT id FROM units WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Unit not found.' });

    await db.query('DELETE FROM units WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Unit deleted.' });
  } catch (err) {
    console.error('deleteUnit error:', err);
    return res.status(500).json({ message: 'Failed to delete unit.' });
  }
}

module.exports = { getUnits, createUnit, updateUnit, deleteUnit };
