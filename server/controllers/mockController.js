const db = require('../db/connection');
const { generateMockQuestion, evaluateAnswer } = require('../services/geminiService');

// POST /api/mock/generate
async function generateQuestion(req, res) {
  const { subject_id, unit_id, difficulty, question_type, marks } = req.body;

  if (!subject_id || !difficulty || !question_type || !marks) {
    return res.status(400).json({ message: 'subject_id, difficulty, question_type, and marks are required.' });
  }

  const validDifficulty = ['easy', 'medium', 'hard'];
  const validTypes = ['long_answer', 'short_answer', 'case_study'];
  const validMarks = [2, 5, 10, 15];

  if (!validDifficulty.includes(difficulty)) return res.status(400).json({ message: 'Invalid difficulty.' });
  if (!validTypes.includes(question_type)) return res.status(400).json({ message: 'Invalid question_type.' });
  if (!validMarks.includes(Number(marks))) return res.status(400).json({ message: 'Marks must be 2, 5, 10, or 15.' });

  try {
    // Verify subject
    const [subRows] = await db.query('SELECT * FROM subjects WHERE id = ? AND user_id = ?', [subject_id, req.user.id]);
    if (subRows.length === 0) return res.status(404).json({ message: 'Subject not found.' });
    const subject = subRows[0];

    // Get unit if specified
    let unit = null;
    if (unit_id) {
      const [unitRows] = await db.query('SELECT * FROM units WHERE id = ? AND user_id = ? AND subject_id = ?', [unit_id, req.user.id, subject_id]);
      if (unitRows.length === 0) return res.status(404).json({ message: 'Unit not found.' });
      unit = unitRows[0];
    }

    // Build syllabus context
    const [allUnits] = await db.query('SELECT * FROM units WHERE subject_id = ? AND user_id = ? ORDER BY unit_number ASC', [subject_id, req.user.id]);
    const syllabus = allUnits.map(u => `Unit ${u.unit_number}: ${u.title}${u.description ? ' - ' + u.description : ''}`).join('\n');

    // Get relevant material text
    let materialContext = '';
    const matQuery = unit_id
      ? 'SELECT title, extracted_text FROM study_materials WHERE subject_id = ? AND unit_id = ? AND user_id = ? AND extracted_text IS NOT NULL LIMIT 3'
      : 'SELECT title, extracted_text FROM study_materials WHERE subject_id = ? AND user_id = ? AND extracted_text IS NOT NULL LIMIT 3';
    const matParams = unit_id ? [subject_id, unit_id, req.user.id] : [subject_id, req.user.id];
    const [materials] = await db.query(matQuery, matParams);
    if (materials.length > 0) {
      materialContext = materials.map(m => `${m.title}:\n${m.extracted_text.substring(0, 2000)}`).join('\n\n');
    }

    const questionText = await generateMockQuestion(subject, unit, syllabus, difficulty, question_type, Number(marks), materialContext);

    // Save question
    const [result] = await db.query(
      'INSERT INTO mock_questions (user_id, subject_id, unit_id, question_text, difficulty, question_type, marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, subject_id, unit_id || null, questionText.trim(), difficulty, question_type, Number(marks)]
    );

    return res.status(201).json({
      question: {
        id: result.insertId,
        subject_id,
        unit_id: unit_id || null,
        question_text: questionText.trim(),
        difficulty,
        question_type,
        marks: Number(marks),
        subject_name: subject.name,
        unit_title: unit ? unit.title : null,
        unit_number: unit ? unit.unit_number : null,
      },
    });
  } catch (err) {
    console.error('generateQuestion error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ message: 'AI service is not configured. Please set GEMINI_API_KEY.' });
    }
    return res.status(500).json({ message: err.message || 'Failed to generate question.' });
  }
}

// POST /api/mock/submit
async function submitAnswer(req, res) {
  const { question_id, student_answer } = req.body;

  if (!question_id || !student_answer || student_answer.trim().length < 5) {
    return res.status(400).json({ message: 'question_id and a meaningful student_answer are required.' });
  }

  try {
    // Verify question belongs to user
    const [qRows] = await db.query(
      `SELECT mq.*, s.name AS subject_name, u.title AS unit_title, u.unit_number
       FROM mock_questions mq
       LEFT JOIN subjects s ON s.id = mq.subject_id
       LEFT JOIN units u ON u.id = mq.unit_id
       WHERE mq.id = ? AND mq.user_id = ?`,
      [question_id, req.user.id]
    );
    if (qRows.length === 0) return res.status(404).json({ message: 'Question not found.' });
    const question = qRows[0];

    // Prevent duplicate submissions for same question within 2 minutes
    const [recent] = await db.query(
      'SELECT id FROM mock_attempts WHERE question_id = ? AND user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)',
      [question_id, req.user.id]
    );
    if (recent.length > 0) {
      return res.status(429).json({ message: 'Please wait before submitting again for the same question.' });
    }

    // Save attempt
    const [attemptResult] = await db.query(
      'INSERT INTO mock_attempts (user_id, question_id, student_answer, max_marks, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, question_id, student_answer.trim(), question.marks, 'submitted']
    );
    const attemptId = attemptResult.insertId;

    // Build context for evaluation
    const [allUnits] = await db.query('SELECT * FROM units WHERE subject_id = ? AND user_id = ? ORDER BY unit_number ASC', [question.subject_id, req.user.id]);
    const syllabus = allUnits.map(u => `Unit ${u.unit_number}: ${u.title}${u.description ? ' - ' + u.description : ''}`).join('\n');

    let materialContext = '';
    if (question.unit_id) {
      const [mats] = await db.query(
        'SELECT title, extracted_text FROM study_materials WHERE subject_id = ? AND unit_id = ? AND user_id = ? AND extracted_text IS NOT NULL LIMIT 2',
        [question.subject_id, question.unit_id, req.user.id]
      );
      materialContext = mats.map(m => `${m.title}:\n${m.extracted_text.substring(0, 2000)}`).join('\n\n');
    }

    // Evaluate
    const evaluation = await evaluateAnswer(
      question.question_text,
      student_answer.trim(),
      question.marks,
      question.question_type,
      question.difficulty,
      syllabus,
      materialContext
    );

    // Save evaluation
    await db.query(
      `INSERT INTO evaluations 
        (attempt_id, user_id, score, max_marks, breakdown_conceptual, breakdown_accuracy, breakdown_completeness, breakdown_structure, breakdown_examples, strengths, missing_points, incorrect_points, improvement_suggestions, model_answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        req.user.id,
        evaluation.score,
        question.marks,
        evaluation.breakdown?.conceptual_understanding || null,
        evaluation.breakdown?.accuracy || null,
        evaluation.breakdown?.completeness || null,
        evaluation.breakdown?.structure || null,
        evaluation.breakdown?.examples || null,
        evaluation.strengths || '',
        evaluation.missing_points || '',
        evaluation.incorrect_points || '',
        evaluation.improvement_suggestions || '',
        evaluation.model_answer || '',
      ]
    );

    // Update attempt score and status
    await db.query(
      'UPDATE mock_attempts SET score = ?, status = ? WHERE id = ?',
      [evaluation.score, 'evaluated', attemptId]
    );

    return res.status(201).json({
      message: 'Answer evaluated successfully.',
      attempt_id: attemptId,
      score: evaluation.score,
      max_marks: question.marks,
      evaluation,
      question: {
        question_text: question.question_text,
        subject_name: question.subject_name,
        unit_title: question.unit_title,
        difficulty: question.difficulty,
        question_type: question.question_type,
      },
    });
  } catch (err) {
    console.error('submitAnswer error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ message: 'AI service is not configured. Please set GEMINI_API_KEY.' });
    }
    return res.status(500).json({ message: err.message || 'Evaluation failed. Please try again.' });
  }
}

module.exports = { generateQuestion, submitAnswer };
