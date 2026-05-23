const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/board/today-tasks', protect, taskController.getTodayTaskData);
router.get('/board/:id', protect, taskController.getBoardData);
router.get('/board/assigned/:id', protect, taskController.getAssignedBoardData);
router.patch('/:taskId/position', protect, taskController.updateTaskStatus);
router.post('/create', protect, taskController.createTask);
router.put('/:taskId', protect, taskController.updateTaskFields);

// Comments Endpoints
router.post('/:taskId/comments', protect, taskController.addTaskComment);
router.get('/:taskId/comments', protect, taskController.getTaskComments);

// Subtasks Endpoints
router.post('/:taskId/subtasks', protect, taskController.createSubtask);
router.put('/subtasks/:subtaskId/toggle', protect, taskController.toggleSubtaskStatus);
router.get('/:taskId/subtasks', protect, taskController.getTaskSubtasks);

// Task Assignees Endpoints
router.get('/:taskId/assignees', protect, taskController.getTaskAssignees);
router.post('/:taskId/assignees/toggle', protect, taskController.toggleTaskAssignee);

router.get('/projects/:projectId/epics', protect, taskController.getProjectEpics);
router.put('/:taskId/epic', protect, taskController.updateTaskEpic);

module.exports = router;