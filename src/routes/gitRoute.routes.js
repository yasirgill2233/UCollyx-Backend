const express = require('express');
const router = express.Router();
const { getGitGraphData } = require('../controllers/gitControllers'); // Controller banao

router.get('/graph/:projectId', (req, res) => {
    getGitGraphData(req.params.projectId, (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to fetch git log" });
        res.json(data);
    });
});

module.exports = router;