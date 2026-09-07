/**
 * ocrController.js
 *
 * Handles handwriting image → text extraction via Gemini Vision.
 * Isolated module — can be removed without touching any other feature.
 *
 * POST /api/mock/ocr
 *   multipart/form-data: field "handwriting" (image file)
 *   Returns: { extracted_text: string }
 */

const { extractHandwritingFromImage } = require('../services/geminiService');

// Allowed MIME types that Gemini Vision accepts well
const GEMINI_SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

async function extractHandwriting(req, res) {
  // multer memoryUpload middleware has already run by this point.
  // req.file contains: { fieldname, originalname, mimetype, buffer, size }

  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded. Please select an image of your handwritten answer.' });
  }

  if (req.file.size === 0) {
    return res.status(400).json({ message: 'Uploaded file is empty.' });
  }

  if (!GEMINI_SUPPORTED_MIME_TYPES.has(req.file.mimetype)) {
    return res.status(400).json({
      message: `Unsupported image format: ${req.file.mimetype}. Please upload a JPG, PNG, or WebP image.`,
    });
  }

  try {
    // Convert buffer to base64 — this is what the Gemini inline data API expects
    const base64Image = req.file.buffer.toString('base64');

    const extractedText = await extractHandwritingFromImage(base64Image, req.file.mimetype);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({
        message: 'No text could be read from the image. Please ensure the handwriting is clear and the image is well-lit.',
      });
    }

    return res.json({
      extracted_text: extractedText,
      char_count: extractedText.length,
    });

  } catch (err) {
    console.error('OCR extraction error:', err);

    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ message: 'AI service is not configured. Please set GEMINI_API_KEY.' });
    }

    // Gemini couldn't process the image (e.g. image too blurry, unusual format)
    if (err.message?.includes('image') || err.message?.includes('vision') || err.message?.includes('Unable to process')) {
      return res.status(422).json({
        message: 'Could not process the image. Please try a clearer, well-lit photo of your handwritten answer.',
      });
    }

    return res.status(500).json({ message: 'Handwriting extraction failed. Please try again or type your answer.' });
  }
}

module.exports = { extractHandwriting };