const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PPT, and PPTX files are allowed.'), false);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

function createStoredFilename(originalFilename) {
  const ext = path.extname(originalFilename).toLowerCase();
  return `${randomUUID()}${ext}`;
}

// ── Memory-based upload for OCR (no files saved to disk) ─────────────────────
// Allowed image MIME types for handwriting upload
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB — adequate for a phone photo

function imageFileFilter(req, file, cb) {
  if (ALLOWED_IMAGE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Please upload a JPG, PNG, or WebP image.'), false);
  }
}

// Uses memoryStorage — the buffer lives in req.file.buffer, never written to disk
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

module.exports = { upload, ALLOWED_TYPES, memoryUpload, ALLOWED_IMAGE_TYPES, createStoredFilename };