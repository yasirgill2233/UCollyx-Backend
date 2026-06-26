const express = require('express');
const router = express.Router();

// Yeh automatically ban jayega: /api/webhooks/pipeline-status
router.post('/pipeline-status', async (req, res) => {
    try {
        const { project_id, status, log_summary } = req.body;
        console.log(`📡 GitHub Notification Received for ${project_id}`);

        if (global.io) {
            global.io.emit('pipeline-update', { project_id, status, log_summary });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;