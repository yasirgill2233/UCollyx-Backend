const express = require('express');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
const fileController = require('../controllers/file.controller');

router.post('/upload-local', fileController.uploadLocalProject);
router.get('/tree', fileController.getFileTreeHandler);
router.post('/content', fileController.getFileContentHandler);
router.post('/save', fileController.saveFileHandler);
router.post('/create', fileController.createFileHandler);
router.post('/delete', fileController.deleteFileHandler);

module.exports = router;