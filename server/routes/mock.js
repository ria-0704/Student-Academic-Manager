// const express = require('express');
// const router = express.Router();
// const { authenticateToken } = require('../middleware/auth');
// const { generateQuestion, submitAnswer } = require('../controllers/mockController');

// router.use(authenticateToken);

// router.post('/generate', generateQuestion);
// router.post('/submit',   submitAnswer);

// module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateQuestion, submitAnswer } = require('../controllers/mockController');
const { extractHandwriting } = require('../controllers/ocrController');
const { memoryUpload } = require('../middleware/upload');

router.use(authenticateToken);

router.post('/generate', generateQuestion);
router.post('/submit',   submitAnswer);

// Handwriting OCR — isolated route, images never saved to disk
router.post('/ocr', memoryUpload.single('handwriting'), extractHandwriting);

module.exports = router;