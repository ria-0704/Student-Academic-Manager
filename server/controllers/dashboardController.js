const db = require('../db/connection');

async function getDashboard(req, res) {
  const userId = req.user.id;
  try {
    // Subject count
    const [[{ subject_count }]] = await db.query('SELECT COUNT(*) AS subject_count FROM subjects WHERE user_id = ?', [userId]);

    // Material stats
    const [[matStats]] = await db.query(
      `SELECT COUNT(*) AS total_materials,
              SUM(CASE WHEN study_status = 'completed' THEN 1 ELSE 0 END) AS completed_materials
       FROM study_materials WHERE user_id = ?`,
      [userId]
    );

    // Upcoming exam (nearest future)
    const [upcomingExams] = await db.query(
      `SELECT * FROM exams WHERE user_id = ? AND exam_date >= CURDATE() ORDER BY exam_date ASC, exam_time ASC LIMIT 1`,
      [userId]
    );

    // Today's study tasks
    const [todayTasks] = await db.query(
      `SELECT * FROM study_tasks WHERE user_id = ? AND (task_date = CURDATE() OR task_date IS NULL) AND is_completed = 0 LIMIT 5`,
      [userId]
    );

    // Recent mock attempts
    const [recentAttempts] = await db.query(
      `SELECT ma.id, ma.score, ma.max_marks, ma.created_at,
              mq.question_text, mq.difficulty,
              s.name AS subject_name
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       LEFT JOIN subjects s ON s.id = mq.subject_id
       WHERE ma.user_id = ?
       ORDER BY ma.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Incomplete materials (for display)
    const [incompleteMaterials] = await db.query(
      `SELECT sm.id, sm.title, sm.study_status, sm.file_type, s.name AS subject_name
       FROM study_materials sm
       LEFT JOIN subjects s ON s.id = sm.subject_id
       WHERE sm.user_id = ? AND sm.study_status != 'completed'
       ORDER BY sm.created_at DESC
       LIMIT 6`,
      [userId]
    );

    const upcomingExam = upcomingExams.length > 0 ? upcomingExams[0] : null;
    let daysRemaining = null;
    if (upcomingExam) {
      const examDate = new Date(upcomingExam.exam_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      examDate.setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    }

    return res.json({
      subject_count: Number(subject_count),
      total_materials: Number(matStats.total_materials),
      completed_materials: Number(matStats.completed_materials),
      completion_percentage: matStats.total_materials > 0
        ? Math.round((matStats.completed_materials / matStats.total_materials) * 100)
        : 0,
      upcoming_exam: upcomingExam,
      days_remaining: daysRemaining,
      today_tasks: todayTasks,
      recent_attempts: recentAttempts,
      incomplete_materials: incompleteMaterials,
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ message: 'Failed to load dashboard.' });
  }
}

module.exports = { getDashboard };
