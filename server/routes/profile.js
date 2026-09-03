const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

router.use(authenticateToken);
router.get('/',  getProfile);
router.put('/',  updateProfile);

module.exports = router;
