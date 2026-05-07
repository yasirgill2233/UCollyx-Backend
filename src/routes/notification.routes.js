const express = require('express');
const router = express.Router();
const { getNotifications, updateReadStatus } = require('../controllers/notification.controller');

const notificationController = require('../controllers/notification.controller');

const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, notificationController.getNotifications);
router.put('/mark-all-read', protect, notificationController.markAllAsRead);
router.put('/mark-read', protect, notificationController.updateReadStatus);
router.post('/send', protect, notificationController.sendMessage);

module.exports = router;