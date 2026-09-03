const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getUnits, createUnit, updateUnit, deleteUnit } = require('../controllers/unitController');

router.use(authenticateToken);

router.get('/',     getUnits);
router.post('/',    createUnit);
router.put('/:id',  updateUnit);
router.delete('/:id', deleteUnit);

module.exports = router;
