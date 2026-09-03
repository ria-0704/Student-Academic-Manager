const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getSummaries, generateSummary } = require('../controllers/summaryController');

router.use(authenticateToken);

router.get('/:materialId',           getSummaries);
router.post('/:materialId/generate', generateSummary);

module.exports = router;
