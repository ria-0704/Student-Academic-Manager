const db = require('../db/connection');

// GET /api/attempts  — list all attempts for the user
async function getAttempts(req, res) {
  try {
    const [attempts] = await db.query(
      `SELECT 
        ma.id, ma.score, ma.max_marks, ma.status, ma.created_at,
        mq.question_text, mq.difficulty, mq.question_type, mq.marks,
        s.name AS subject_name, s.id AS subject_id,
        u.title AS unit_title, u.unit_number
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       LEFT JOIN subjects s ON s.id = mq.subject_id
       LEFT JOIN units u ON u.id = mq.unit_id
       WHERE ma.user_id = ?
       ORDER BY ma.created_at DESC`,
      [req.user.id]
    );
    return res.json({ attempts });
  } catch (err) {
    console.error('getAttempts error:', err);
    return res.status(500).json({ message: 'Failed to fetch attempts.' });
  }
}

// GET /api/attempts/:id  — get a single attempt with full evaluation
async function getAttempt(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT 
        ma.id, ma.student_answer, ma.score, ma.max_marks, ma.status, ma.created_at,
        mq.question_text, mq.difficulty, mq.question_type, mq.marks,
        s.name AS subject_name, u.title AS unit_title, u.unit_number,
        e.breakdown_conceptual, e.breakdown_accuracy, e.breakdown_completeness,
        e.breakdown_structure, e.breakdown_examples,
        e.strengths, e.missing_points, e.incorrect_points,
        e.improvement_suggestions, e.model_answer
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       LEFT JOIN subjects s ON s.id = mq.subject_id
       LEFT JOIN units u ON u.id = mq.unit_id
       LEFT JOIN evaluations e ON e.attempt_id = ma.id
       WHERE ma.id = ? AND ma.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Attempt not found.' });
    return res.json({ attempt: rows[0] });
  } catch (err) {
    console.error('getAttempt error:', err);
    return res.status(500).json({ message: 'Failed to fetch attempt.' });
  }
}

module.exports = { getAttempts, getAttempt };
