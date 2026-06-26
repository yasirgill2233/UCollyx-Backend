const express = require("express");
const router = express.Router();

// Yeh automatically ban jayega: /api/webhooks/pipeline-status
// backend/routes/webhook.js
router.post("/pipeline-status", async (req, res) => {
  try {
    const { project_id, status, log_summary } = req.body;

    console.log(
      `📡 Pipeline Webhook Hit! Project: ${project_id}, Status: ${status}`,
    );

    // ================= 🎯 PIPELINE SOCKET DISPATCH =================
    if (global.io) {
      // Frontend par jis room ko join kiya hua hai exact wahi string match karni hai
      const roomName = `project_room:${project_id}`;

      global.io.to(roomName).emit("pipeline:status_received", {
        project_id: Number(project_id),
        status, // 'success' ya 'failed'
        log_summary, // logs ki short summary
      });

      console.log(
        `📡 Real-Time Socket Broadcast executed for Pipeline in Room: ${roomName}`,
      );
    } else {
      console.log("⚠️ global.io is not initialized on backend!");
    }

    return res.status(200).json({
      success: true,
      message: "Notification broadcasted successfully!",
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
