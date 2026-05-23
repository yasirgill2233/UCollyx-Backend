const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const meetingController = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth.middleware');

// Jab meeting end ho, to frontend ye API call kray ga
router.post('/finalize/:messageId', protect, upload.single('audio'), meetingController.finalizeMeeting);
router.post('/create', protect, meetingController.createMeeting);
router.get('/', protect, meetingController.getAllMeetings);

module.exports = router;