// controllers/meetingController.js
const meetingService = require("../services/audiomeeting.service");

const finalizeMeetingController = async (req, res) => {
  try {
    const audioFile = req.file;
    const { meetingId } = req.body;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required for processing transcript.",
      });
    }

    // Call Service Layer
    const result = await meetingService.finalizeMeeting(audioFile, meetingId);

    return res.status(200).json({
      success: true,
      message: "Meeting transcript generated successfully.",
      transcript: result.transcript,
    });
  } catch (error) {
    console.error("❌ Error in finalizeMeetingController:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process meeting transcript.",
      error: error.message,
    });
  }
};

module.exports = {
  finalizeMeetingController,
};