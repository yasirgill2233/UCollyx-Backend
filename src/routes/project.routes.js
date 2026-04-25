const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

// In routes ke liye login hona zaroori hai
router.get('/get', protect, projectController.getWorkspaceProjects);
router.get('/my-projects', protect, projectController.getMyProjects);
router.post('/create', protect, projectController.createProject);
router.patch('/:id/archive', protect, projectController.archiveProject);
router.patch('/:id/active', protect, projectController.activeProject);
router.post('/:id/team', protect, projectController.handleUpdateTeam);

module.exports = router;