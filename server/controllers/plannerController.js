const db = require('../db/connection');
const { generateStudyRecommendations } = require('../services/geminiService');

// GET /api/planner
async function getTasks(req, res) {
  try {
    const [tasks] = await db.query(
      `SELECT st.*, s.name AS subject_name_resolved, u.title AS unit_name_resolved
       FROM study_tasks st
       LEFT JOIN subjects s ON s.id = st.subject_id
       LEFT JOIN units u ON u.id = st.unit_id
       WHERE st.user_id = ?
       ORDER BY st.task_date ASC, st.priority DESC, st.created_at ASC`,
      [req.user.id]
    );
    return res.json({ tasks });
  } catch (err) {
    console.error('getTasks error:', err);
    return res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
}

// POST /api/planner
async function createTask(req, res) {
  const { subject_id, unit_id, title, subject_name, unit_name, task_date, estimated_duration, priority } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title is required.' });

  try {
    const [result] = await db.query(
      `INSERT INTO study_tasks (user_id, subject_id, unit_id, title, subject_name, unit_name, task_date, estimated_duration, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, subject_id || null, unit_id || null, title.trim(), subject_name || null, unit_name || null,
       task_date || null, estimated_duration || 60, priority || 'medium']
    );
    const [rows] = await db.query('SELECT * FROM study_tasks WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Task created.', task: rows[0] });
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ message: 'Failed to create task.' });
  }
}

// PUT /api/planner/:id
async function updateTask(req, res) {
  const { title, subject_name, unit_name, task_date, estimated_duration, priority, is_completed } = req.body;

  try {
    const [check] = await db.query('SELECT * FROM study_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Task not found.' });

    const t = check[0];
    await db.query(
      `UPDATE study_tasks SET title = ?, subject_name = ?, unit_name = ?, task_date = ?, 
       estimated_duration = ?, priority = ?, is_completed = ?
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title.trim() : t.title,
        subject_name !== undefined ? subject_name : t.subject_name,
        unit_name !== undefined ? unit_name : t.unit_name,
        task_date !== undefined ? task_date : t.task_date,
        estimated_duration !== undefined ? estimated_duration : t.estimated_duration,
        priority !== undefined ? priority : t.priority,
        is_completed !== undefined ? is_completed : t.is_completed,
        req.params.id,
        req.user.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM study_tasks WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Task updated.', task: rows[0] });
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ message: 'Failed to update task.' });
  }
}

// DELETE /api/planner/:id
async function deleteTask(req, res) {
  try {
    const [check] = await db.query('SELECT id FROM study_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Task not found.' });
    await db.query('DELETE FROM study_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Task deleted.' });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ message: 'Failed to delete task.' });
  }
}

// POST /api/planner/generate  — AI-based task generation
async function generateTasks(req, res) {
  try {
    const userId = req.user.id;

    // Gather context
    const [upcomingExams] = await db.query(
      "SELECT subject_name, exam_date, exam_time FROM exams WHERE user_id = ? AND exam_date >= CURDATE() ORDER BY exam_date ASC LIMIT 5",
      [userId]
    );

    const [incompleteMaterials] = await db.query(
      `SELECT sm.title, s.name AS subject_name, u.title AS unit_title
       FROM study_materials sm
       LEFT JOIN subjects s ON s.id = sm.subject_id
       LEFT JOIN units u ON u.id = sm.unit_id
       WHERE sm.user_id = ? AND sm.study_status != 'completed'
       LIMIT 10`,
      [userId]
    );

    const [weakSubjects] = await db.query(
      `SELECT s.name AS subject_name, AVG(ma.score / ma.max_marks * 100) AS avg_pct
       FROM mock_attempts ma
       JOIN mock_questions mq ON mq.id = ma.question_id
       JOIN subjects s ON s.id = mq.subject_id
       WHERE ma.user_id = ? AND ma.status = 'evaluated'
       GROUP BY s.id
       ORDER BY avg_pct ASC
       LIMIT 5`,
      [userId]
    );

    const context = `
Upcoming Exams: ${upcomingExams.length > 0 ? upcomingExams.map(e => `${e.subject_name} on ${e.exam_date}`).join(', ') : 'None'}
Incomplete Materials: ${incompleteMaterials.length > 0 ? incompleteMaterials.map(m => `"${m.title}" (${m.subject_name})`).join(', ') : 'None'}
Weak Subjects (low mock scores): ${weakSubjects.length > 0 ? weakSubjects.map(w => `${w.subject_name} (${Math.round(w.avg_pct)}%)`).join(', ') : 'None identified yet'}
Today's Date: ${new Date().toISOString().split('T')[0]}`;

    const recommendations = await generateStudyRecommendations(context);

    // Save generated tasks
    const today = new Date();
    const savedTasks = [];

    for (const task of recommendations) {
      if (!task.title) continue;
      const taskDate = new Date(today);
      taskDate.setDate(taskDate.getDate() + (task.days_from_now || 0));
      const dateStr = taskDate.toISOString().split('T')[0];

      const [result] = await db.query(
        `INSERT INTO study_tasks (user_id, title, subject_name, unit_name, task_date, estimated_duration, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, task.title, task.subject_name || null, task.unit_name || null, dateStr, task.estimated_duration || 60, task.priority || 'medium']
      );
      savedTasks.push({ id: result.insertId, ...task, task_date: dateStr });
    }

    return res.json({ message: `Generated ${savedTasks.length} study tasks.`, tasks: savedTasks });
  } catch (err) {
    console.error('generateTasks error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ message: 'AI service is not configured.' });
    }
    return res.status(500).json({ message: 'Failed to generate tasks.' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, generateTasks };
