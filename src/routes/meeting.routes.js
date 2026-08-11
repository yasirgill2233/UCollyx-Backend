const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const meetingController = require('../controllers/meeting.controller');
const audiomeetingController = require('../controllers/audiomeeting.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/finalize/', protect, upload.single('audio'), audiomeetingController.finalizeMeetingController);
router.post('/finalize/:messageId', protect, upload.single('audio'), meetingController.finalizeMeeting);
router.post('/create', protect, meetingController.createMeeting);
router.get('/', protect, meetingController.getAllMeetings);

module.exports = router;