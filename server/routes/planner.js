const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask, generateTasks } = require('../controllers/plannerController');

router.use(authenticateToken);

router.get('/',          getTasks);
router.post('/',         createTask);
router.post('/generate', generateTasks);
router.put('/:id',       updateTask);
router.delete('/:id',    deleteTask);

module.exports = router;
