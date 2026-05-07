const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');

router.get('/proj', protect, userController.getProjUsers);
router.get('/all', protect, userController.getAllUsers);
router.put('/profile', protect, upload.single('avatar'), userController.updateProfile);
router.get('/signed-out',protect, userController.logout);
router.post('/:userId/status', protect, userController.toggleUserStatus);

module.exports = router;
