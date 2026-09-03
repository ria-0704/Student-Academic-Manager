const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAttempts, getAttempt } = require('../controllers/attemptController');

router.use(authenticateToken);

router.get('/',    getAttempts);
router.get('/:id', getAttempt);

module.exports = router;
