const db = require('../db/connection');

// GET /api/exams
async function getExams(req, res) {
  try {
    const [exams] = await db.query(
      `SELECT e.*, s.name AS linked_subject_name
       FROM exams e
       LEFT JOIN subjects s ON s.id = e.subject_id
       WHERE e.user_id = ?
       ORDER BY e.exam_date ASC, e.exam_time ASC`,
      [req.user.id]
    );
    return res.json({ exams });
  } catch (err) {
    console.error('getExams error:', err);
    return res.status(500).json({ message: 'Failed to fetch exams.' });
  }
}

// POST /api/exams
async function createExam(req, res) {
  const { subject_id, subject_name, exam_date, exam_time, location, notes } = req.body;
  if (!subject_name || !exam_date || !exam_time) {
    return res.status(400).json({ message: 'subject_name, exam_date, and exam_time are required.' });
  }

  try {
    if (subject_id) {
      const [subCheck] = await db.query('SELECT id FROM subjects WHERE id = ? AND user_id = ?', [subject_id, req.user.id]);
      if (subCheck.length === 0) return res.status(404).json({ message: 'Subject not found.' });
    }

    const [result] = await db.query(
      'INSERT INTO exams (user_id, subject_id, subject_name, exam_date, exam_time, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, subject_id || null, subject_name.trim(), exam_date, exam_time, location ? location.trim() : null, notes ? notes.trim() : null]
    );
    const [rows] = await db.query('SELECT * FROM exams WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Exam added.', exam: rows[0] });
  } catch (err) {
    console.error('createExam error:', err);
    return res.status(500).json({ message: 'Failed to add exam.' });
  }
}

// PUT /api/exams/:id
async function updateExam(req, res) {
  const { subject_name, exam_date, exam_time, location, notes, subject_id } = req.body;
  if (!subject_name || !exam_date || !exam_time) {
    return res.status(400).json({ message: 'subject_name, exam_date, and exam_time are required.' });
  }

  try {
    const [check] = await db.query('SELECT id FROM exams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Exam not found.' });

    await db.query(
      'UPDATE exams SET subject_id = ?, subject_name = ?, exam_date = ?, exam_time = ?, location = ?, notes = ? WHERE id = ? AND user_id = ?',
      [subject_id || null, subject_name.trim(), exam_date, exam_time, location ? location.trim() : null, notes ? notes.trim() : null, req.params.id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Exam updated.', exam: rows[0] });
  } catch (err) {
    console.error('updateExam error:', err);
    return res.status(500).json({ message: 'Failed to update exam.' });
  }
}

// DELETE /api/exams/:id
async function deleteExam(req, res) {
  try {
    const [check] = await db.query('SELECT id FROM exams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Exam not found.' });

    await db.query('DELETE FROM exams WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Exam deleted.' });
  } catch (err) {
    console.error('deleteExam error:', err);
    return res.status(500).json({ message: 'Failed to delete exam.' });
  }
}

module.exports = { getExams, createExam, updateExam, deleteExam };
