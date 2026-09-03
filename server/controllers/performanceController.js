const db = require('../db/connection');

async function getPerformance(req, res) {
  const userId = req.user.id;
  try {
    // Overall stats
    const [[overall]] = await db.query(
      `SELECT 
        COUNT(*) AS total_attempts,
        AVG(score / max_marks * 100) AS avg_pct,
        MAX(score / max_marks * 100) AS best_pct
       FROM mock_attempts WHERE user_id = ? AND status = 'evaluated'`,
      [userId]
    );

    // Per-subject performance
    const [bySubject] = await db.query(
      `SELECT 
        s.name AS subject_name,
        COUNT(ma.id) AS attempts,
        AVG(ma.score / ma.max_marks * 100) AS avg_pct,
        MAX(ma.score / ma.max_marks * 100) AS best_pct
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       JOIN subjects s ON s.id = mq.subject_id
       WHERE ma.user_id = ? AND ma.status = 'evaluated'
       GROUP BY s.id
       ORDER BY avg_pct DESC`,
      [userId]
    );

    // Score over time (last 30 attempts)
    const [overtime] = await db.query(
      `SELECT 
        ma.created_at,
        ma.score,
        ma.max_marks,
        ROUND(ma.score / ma.max_marks * 100, 1) AS pct,
        s.name AS subject_name
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       LEFT JOIN subjects s ON s.id = mq.subject_id
       WHERE ma.user_id = ? AND ma.status = 'evaluated'
       ORDER BY ma.created_at ASC
       LIMIT 30`,
      [userId]
    );

    // By difficulty
    const [byDifficulty] = await db.query(
      `SELECT 
        mq.difficulty,
        COUNT(ma.id) AS attempts,
        AVG(ma.score / ma.max_marks * 100) AS avg_pct
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       WHERE ma.user_id = ? AND ma.status = 'evaluated'
       GROUP BY mq.difficulty`,
      [userId]
    );

    return res.json({
      total_attempts: Number(overall.total_attempts),
      avg_percentage: overall.avg_pct ? Math.round(overall.avg_pct) : 0,
      best_percentage: overall.best_pct ? Math.round(overall.best_pct) : 0,
      by_subject: bySubject.map(s => ({ ...s, avg_pct: Math.round(s.avg_pct), best_pct: Math.round(s.best_pct) })),
      over_time: overtime,
      by_difficulty: byDifficulty.map(d => ({ ...d, avg_pct: Math.round(d.avg_pct) })),
    });
  } catch (err) {
    console.error('getPerformance error:', err);
    return res.status(500).json({ message: 'Failed to load performance data.' });
  }
}

module.exports = { getPerformance };
