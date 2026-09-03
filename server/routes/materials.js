const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { getMaterials, uploadMaterial, updateMaterial, deleteMaterial, downloadMaterial } = require('../controllers/materialController');

router.use(authenticateToken);

router.get('/',                    getMaterials);
router.post('/',   upload.single('file'), uploadMaterial);
router.put('/:id',                 updateMaterial);
router.delete('/:id',              deleteMaterial);
router.get('/:id/download',        downloadMaterial);

module.exports = router;
