const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getPerformance } = require('../controllers/performanceController');

router.use(authenticateToken);
router.get('/', getPerformance);

module.exports = router;
