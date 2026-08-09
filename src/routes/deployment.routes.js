const express = require('express');
const router = express.Router();
const { getProjectDeployments } = require('../controllers/deployment.controller.js');
const { protect } = require('../middleware/auth.middleware.js');

// 🌟 Route to fetch deployments by Project ID
router.get('/project/:projectId',protect, getProjectDeployments);

module.exports = router;