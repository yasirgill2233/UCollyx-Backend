const express = require('express');
const router = express.Router();

const messageController = require('../controllers/message.controller');

const { strictLimiter } = require('../middleware/rateLimiter.middleware'); // Import limiter

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload');

router.get('/channel/:channelId', protect, messageController.getChannelMessages);
router.get('/dm/:receiverId', protect, messageController.getDMMessages);
// router.post('/send', protect, messageController.sendMessage);
router.post('/send', protect, upload.array('attachments', 5), messageController.sendMessage);
router.get('/conversations', protect, messageController.getConversations);

router.post('/start-call', protect, messageController.startCall);
router.patch('/end-call/:messageId', protect, messageController.endCall);
router.post('/schedule-call', protect, messageController.scheduleCall);
router.patch('/update-status/:messageId', protect, messageController.updateStatus);

module.exports = router;