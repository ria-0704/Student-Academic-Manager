const db = require('../db/connection');

// GET /api/subjects
async function getSubjects(req, res) {
  try {
    const [subjects] = await db.query(
      `SELECT s.*, 
        COUNT(DISTINCT sm.id) AS total_materials,
        SUM(CASE WHEN sm.study_status = 'completed' THEN 1 ELSE 0 END) AS completed_materials
       FROM subjects s
       LEFT JOIN study_materials sm ON sm.subject_id = s.id AND sm.user_id = s.user_id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    return res.json({ subjects });
  } catch (err) {
    console.error('getSubjects error:', err);
    return res.status(500).json({ message: 'Failed to fetch subjects.' });
  }
}

// GET /api/subjects/:id
async function getSubject(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Subject not found.' });

    const subject = rows[0];

    // Fetch units
    const [units] = await db.query(
      'SELECT * FROM units WHERE subject_id = ? AND user_id = ? ORDER BY unit_number ASC',
      [subject.id, req.user.id]
    );

    // Fetch materials with completion
    const [materials] = await db.query(
      'SELECT * FROM study_materials WHERE subject_id = ? AND user_id = ? ORDER BY created_at DESC',
      [subject.id, req.user.id]
    );

    // Recent mock attempts for this subject
    const [attempts] = await db.query(
      `SELECT ma.*, mq.question_text, mq.difficulty, mq.marks, mq.question_type,
              u.title AS unit_title, e.score
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       LEFT JOIN units u ON u.id = mq.unit_id
       LEFT JOIN evaluations e ON e.attempt_id = ma.id
       WHERE ma.user_id = ? AND mq.subject_id = ?
       ORDER BY ma.created_at DESC
       LIMIT 5`,
      [req.user.id, subject.id]
    );

    return res.json({ subject, units, materials, recentAttempts: attempts });
  } catch (err) {
    console.error('getSubject error:', err);
    return res.status(500).json({ message: 'Failed to fetch subject.' });
  }
}

// POST /api/subjects
async function createSubject(req, res) {
  const { name, code, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Subject name is required.' });

  try {
    const [result] = await db.query(
      'INSERT INTO subjects (user_id, name, code, description) VALUES (?, ?, ?, ?)',
      [req.user.id, name.trim(), code ? code.trim() : null, description ? description.trim() : null]
    );
    const [rows] = await db.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Subject created.', subject: rows[0] });
  } catch (err) {
    console.error('createSubject error:', err);
    return res.status(500).json({ message: 'Failed to create subject.' });
  }
}

// PUT /api/subjects/:id
async function updateSubject(req, res) {
  const { name, code, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Subject name is required.' });

  try {
    const [check] = await db.query('SELECT id FROM subjects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Subject not found.' });

    await db.query(
      'UPDATE subjects SET name = ?, code = ?, description = ? WHERE id = ? AND user_id = ?',
      [name.trim(), code ? code.trim() : null, description ? description.trim() : null, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Subject updated.', subject: rows[0] });
  } catch (err) {
    console.error('updateSubject error:', err);
    return res.status(500).json({ message: 'Failed to update subject.' });
  }
}

// DELETE /api/subjects/:id
async function deleteSubject(req, res) {
  try {
    const [check] = await db.query('SELECT id FROM subjects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Subject not found.' });

    await db.query('DELETE FROM subjects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Subject deleted.' });
  } catch (err) {
    console.error('deleteSubject error:', err);
    return res.status(500).json({ message: 'Failed to delete subject.' });
  }
}

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject };
