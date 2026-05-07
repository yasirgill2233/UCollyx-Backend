const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

const { strictLimiter } = require('../middleware/rateLimiter.middleware'); // Import limiter
const { createProjectSchema } = require('../validators/projects/project.validation');

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// In routes ke liye login hona zaroori hai
router.get('/get', protect, projectController.getWorkspaceProjects);
router.get('/my-projects', protect, projectController.getMyProjects);
router.post('/create', protect, validate(createProjectSchema), strictLimiter, projectController.createProject);
router.patch('/:id/archive', protect, projectController.archiveProject);
router.patch('/:id/active', protect, projectController.activeProject);
router.post('/:id/team', protect, projectController.handleUpdateTeam);

module.exports = router;