const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

const { strictLimiter } = require('../middleware/rateLimiter.middleware');
const { createProjectSchema } = require('../validators/projects/project.validation');

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.get('/get', protect, projectController.getWorkspaceProjects);
router.get('/my-projects', protect, projectController.getMyProjects);
router.post('/create', protect, validate(createProjectSchema), strictLimiter, projectController.createProject);
router.get('/details', protect, projectController.getProjectDetails);
router.get('/manager-portfolio', protect, projectController.getManagerPortfolio);
router.get('/developer-project-dashboard', protect, projectController.getDeveloperDashboard);
router.patch('/:id/archive', protect, projectController.archiveProject);
router.patch('/:id/active', protect, projectController.activeProject);
router.post('/:id/team', protect, projectController.handleUpdateTeam);

module.exports = router;