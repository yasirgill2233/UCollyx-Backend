const express = require('express');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
const { uploadLocalProject } = require('../controllers/file.controller');

router.post('/upload-local', uploadLocalProject);

module.exports = router;