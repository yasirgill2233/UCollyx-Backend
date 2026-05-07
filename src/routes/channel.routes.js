const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channel.controller');

const { strictLimiter } = require('../middleware/rateLimiter.middleware'); // Import limiter

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// POST /api/channels/create
router.post('/create',protect, channelController.createChannel);
router.get('/my-channels', protect, channelController.getMyChannels);
router.post('/add-member', protect, channelController.addChannelMember);

module.exports = router;