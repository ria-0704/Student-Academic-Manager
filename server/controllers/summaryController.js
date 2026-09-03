const db = require('../db/connection');
const { summarizeDocument } = require('../services/geminiService');

// GET /api/summaries/:materialId
async function getSummaries(req, res) {
  try {
    const [matCheck] = await db.query('SELECT id FROM study_materials WHERE id = ? AND user_id = ?', [req.params.materialId, req.user.id]);
    if (matCheck.length === 0) return res.status(404).json({ message: 'Material not found.' });

    const [summaries] = await db.query(
      'SELECT id, material_id, summary_type, content, created_at, updated_at FROM summaries WHERE material_id = ? AND user_id = ?',
      [req.params.materialId, req.user.id]
    );
    return res.json({ summaries });
  } catch (err) {
    console.error('getSummaries error:', err);
    return res.status(500).json({ message: 'Failed to fetch summaries.' });
  }
}

// POST /api/summaries/:materialId/generate
async function generateSummary(req, res) {
  const { summary_type, regenerate } = req.body;
  const validTypes = ['quick_revision', 'detailed', 'exam_oriented', 'simple'];

  if (!summary_type || !validTypes.includes(summary_type)) {
    return res.status(400).json({ message: 'Valid summary_type is required: quick_revision, detailed, exam_oriented, simple.' });
  }

  try {
    const [matRows] = await db.query('SELECT * FROM study_materials WHERE id = ? AND user_id = ?', [req.params.materialId, req.user.id]);
    if (matRows.length === 0) return res.status(404).json({ message: 'Material not found.' });

    const material = matRows[0];

    if (!material.extracted_text || material.extracted_text.trim().length < 50) {
      return res.status(400).json({ message: 'Text could not be extracted from this file. Summarization is not available.' });
    }

    // Check if summary already exists (and not requesting regenerate)
    if (!regenerate) {
      const [existing] = await db.query(
        'SELECT * FROM summaries WHERE material_id = ? AND user_id = ? AND summary_type = ?',
        [material.id, req.user.id, summary_type]
      );
      if (existing.length > 0) {
        return res.json({ summary: existing[0], fromCache: true });
      }
    }

    // Generate via Gemini
    const content = await summarizeDocument(material.extracted_text, summary_type, material.title);

    // Upsert summary
    await db.query(
      `INSERT INTO summaries (material_id, user_id, summary_type, content) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP`,
      [material.id, req.user.id, summary_type, content]
    );

    const [rows] = await db.query(
      'SELECT * FROM summaries WHERE material_id = ? AND user_id = ? AND summary_type = ?',
      [material.id, req.user.id, summary_type]
    );

    return res.json({ summary: rows[0], fromCache: false });
  } catch (err) {
    console.error('generateSummary error:', err);
    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ message: 'AI service is not configured. Please set GEMINI_API_KEY.' });
    }
    return res.status(500).json({ message: err.message || 'Failed to generate summary.' });
  }
}

module.exports = { getSummaries, generateSummary };
