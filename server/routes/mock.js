const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateQuestion, submitAnswer } = require('../controllers/mockController');

router.use(authenticateToken);

router.post('/generate', generateQuestion);
router.post('/submit',   submitAnswer);

module.exports = router;
