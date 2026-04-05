const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// GET /api/users/me (Sirf login users ke liye)
router.get('/me', protect, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
});

module.exports = router;