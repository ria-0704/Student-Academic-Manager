const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');

router.use(authenticateToken);

router.get('/',     getSubjects);
router.get('/:id',  getSubject);
router.post('/',    createSubject);
router.put('/:id',  updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
