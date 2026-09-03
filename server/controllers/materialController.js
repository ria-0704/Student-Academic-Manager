const path = require('path');
const fs = require('fs');
const db = require('../db/connection');
const { extractText } = require('../utils/textExtractor');
const { ALLOWED_TYPES } = require('../middleware/upload');

// GET /api/materials?subject_id=X&unit_id=Y
async function getMaterials(req, res) {
  const { subject_id, unit_id } = req.query;

  try {
    let query = 'SELECT sm.*, u.title AS unit_title, s.name AS subject_name FROM study_materials sm LEFT JOIN units u ON u.id = sm.unit_id LEFT JOIN subjects s ON s.id = sm.subject_id WHERE sm.user_id = ?';
    const params = [req.user.id];

    if (subject_id) { query += ' AND sm.subject_id = ?'; params.push(subject_id); }
    if (unit_id)    { query += ' AND sm.unit_id = ?';    params.push(unit_id); }

    query += ' ORDER BY sm.created_at DESC';
    const [materials] = await db.query(query, params);

    // Remove extracted_text from list responses (can be large)
    const safe = materials.map(({ extracted_text, ...rest }) => rest);
    return res.json({ materials: safe });
  } catch (err) {
    console.error('getMaterials error:', err);
    return res.status(500).json({ message: 'Failed to fetch materials.' });
  }
}

// POST /api/materials  (multipart/form-data with file)
async function uploadMaterial(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

  const { subject_id, unit_id, title } = req.body;
  if (!subject_id || !title) {
    // Clean up uploaded file
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: 'subject_id and title are required.' });
  }

  try {
    // Verify subject ownership
    const [subCheck] = await db.query('SELECT id FROM subjects WHERE id = ? AND user_id = ?', [subject_id, req.user.id]);
    if (subCheck.length === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Subject not found.' });
    }

    // Verify unit ownership if provided
    if (unit_id) {
      const [unitCheck] = await db.query('SELECT id FROM units WHERE id = ? AND user_id = ? AND subject_id = ?', [unit_id, req.user.id, subject_id]);
      if (unitCheck.length === 0) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ message: 'Unit not found.' });
      }
    }

    const fileType = ALLOWED_TYPES[req.file.mimetype] || path.extname(req.file.originalname).replace('.', '').toLowerCase();

    // Extract text asynchronously (don't block response)
    let extractedText = null;
    try {
      extractedText = await extractText(req.file.path, fileType);
    } catch (extractErr) {
      console.warn('Text extraction failed:', extractErr.message);
      extractedText = null;
    }

    const [result] = await db.query(
      `INSERT INTO study_materials 
        (user_id, subject_id, unit_id, title, original_filename, stored_filename, file_path, file_type, file_size, extracted_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        subject_id,
        unit_id || null,
        title.trim(),
        req.file.originalname,
        req.file.filename,
        req.file.path,
        fileType,
        req.file.size,
        extractedText,
      ]
    );

    const [rows] = await db.query(
      'SELECT sm.*, u.title AS unit_title, s.name AS subject_name FROM study_materials sm LEFT JOIN units u ON u.id = sm.unit_id LEFT JOIN subjects s ON s.id = sm.subject_id WHERE sm.id = ?',
      [result.insertId]
    );
    const { extracted_text, ...material } = rows[0];

    return res.status(201).json({
      message: 'Material uploaded successfully.',
      material,
      textExtracted: extractedText !== null,
    });
  } catch (err) {
    console.error('uploadMaterial error:', err);
    fs.unlink(req.file.path, () => {});
    return res.status(500).json({ message: 'Failed to upload material.' });
  }
}

// PUT /api/materials/:id  (rename / change status / change unit)
async function updateMaterial(req, res) {
  const { title, study_status, unit_id } = req.body;

  try {
    const [check] = await db.query('SELECT * FROM study_materials WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Material not found.' });

    const updates = {
      title: title ? title.trim() : check[0].title,
      study_status: study_status || check[0].study_status,
      unit_id: unit_id !== undefined ? (unit_id || null) : check[0].unit_id,
    };

    await db.query(
      'UPDATE study_materials SET title = ?, study_status = ?, unit_id = ? WHERE id = ? AND user_id = ?',
      [updates.title, updates.study_status, updates.unit_id, req.params.id, req.user.id]
    );

    const [rows] = await db.query(
      'SELECT sm.*, u.title AS unit_title, s.name AS subject_name FROM study_materials sm LEFT JOIN units u ON u.id = sm.unit_id LEFT JOIN subjects s ON s.id = sm.subject_id WHERE sm.id = ?',
      [req.params.id]
    );
    const { extracted_text, ...material } = rows[0];
    return res.json({ message: 'Material updated.', material });
  } catch (err) {
    console.error('updateMaterial error:', err);
    return res.status(500).json({ message: 'Failed to update material.' });
  }
}

// DELETE /api/materials/:id
async function deleteMaterial(req, res) {
  try {
    const [check] = await db.query('SELECT * FROM study_materials WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Material not found.' });

    // Delete file from disk
    fs.unlink(check[0].file_path, (err) => {
      if (err) console.warn('Could not delete file:', err.message);
    });

    await db.query('DELETE FROM study_materials WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Material deleted.' });
  } catch (err) {
    console.error('deleteMaterial error:', err);
    return res.status(500).json({ message: 'Failed to delete material.' });
  }
}

// GET /api/materials/:id/download  — serve file through authenticated route
async function downloadMaterial(req, res) {
  try {
    const [check] = await db.query('SELECT * FROM study_materials WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Material not found.' });

    const material = check[0];
    if (!fs.existsSync(material.file_path)) {
      return res.status(404).json({ message: 'File not found on server.' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${material.original_filename}"`);
    res.sendFile(path.resolve(material.file_path));
  } catch (err) {
    console.error('downloadMaterial error:', err);
    return res.status(500).json({ message: 'Failed to serve file.' });
  }
}

module.exports = { getMaterials, uploadMaterial, updateMaterial, deleteMaterial, downloadMaterial };
