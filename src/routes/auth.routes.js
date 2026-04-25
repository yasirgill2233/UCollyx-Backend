const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.signup);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/resend-otp', authController.resendOTP);
router.post('/update-password', protect, authController.updatePassword);

module.exports = router;