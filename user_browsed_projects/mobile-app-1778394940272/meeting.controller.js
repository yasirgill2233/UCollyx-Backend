const { Message } = require('../models');
const { processMeetingData } = require('../utils/meetingUtils');

const meetingService = require('../services/meeting.service');
const fs = require('fs');

const finalizeMeeting = async (req, res) => {

    console.log("Meeting Function Called")
  const { messageId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: "No audio file received" });
  }

  try {
    const filePath = req.file.path;

    // AI Processing (Cloudinary + AssemblyAI)
    const { audioUrl, transcriptText } = await processMeetingData(filePath);

    // Database Update (UCollyx Messages Table)
    await Message.update({
      audio_url: audioUrl,
      transcript: transcriptText,
      call_status: 'ended'
    }, { where: { id: messageId } });

    // Server se temporary file delete krain
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      data: { audioUrl, transcript: transcriptText }
    });

  } catch (error) {
    console.error("Meeting Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const userId = req.user.id; 
    const newMeeting = await meetingService.createMeeting(req.body, userId);
    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllMeetings = async (req, res) => {
  console.log("hello")
  try {
    const meetings = await meetingService.fetchAllMeetings(req.user.id);
    console.log("Hey There:========================",meetings)
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    finalizeMeeting,
    getAllMeetings,
    createMeeting
};