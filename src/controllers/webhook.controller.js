const webhookService = require("../services/webhook.service");

const handlePipelineStatus = async (req, res) => {
  try {
    const { project_id, status } = req.body;

    if (!project_id || !status) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: project_id or status" 
      });
    }

    console.log(`📡 Pipeline Webhook Hit! Project: ${project_id}, Status: ${status}`);

    // Call Service Function
    const deployment = await webhookService.logAndBroadcastPipeline(req.body);

    return res.status(200).json({
      success: true,
      message: "Notification logged and broadcasted successfully!",
      data: deployment
    });
  } catch (e) {
    console.error("Error in handlePipelineStatus Controller:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

module.exports = {
  handlePipelineStatus
};