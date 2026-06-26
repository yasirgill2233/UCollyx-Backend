const express = require('express');
const router = express.Router();
const { getProjectDeployments } = require('../controllers/deployment.controller.js');

// 🌟 Route to fetch deployments by Project ID
router.get('/project/:projectId', getProjectDeployments);

module.exports = router;