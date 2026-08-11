const express = require('express');
const router = express.Router();
const { getProjectDeployments } = require('../controllers/deployment.controller.js');
const { protect } = require('../middleware/auth.middleware.js');

router.get('/project/:projectId',protect, getProjectDeployments);

module.exports = router;