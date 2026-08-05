// services/meetingService.js
const fs = require("fs");
const Groq = require("groq-sdk");
const { Meeting } = require("../models"); // Sequelize/ORM Meeting Model

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const finalizeMeeting = async (audioFile, meetingId) => {
  try {
    console.log(`🎙️ Processing transcript for Meeting ID: ${meetingId}...`);

    // 1. Call Groq Speech-to-Text Whisper Model
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.path),
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
    });

    const transcriptText = transcription.text || "No speech detected in recorded audio.";

    // 2. Database update: Save transcript to recap_notes
    if (meetingId) {
      await Meeting.update(
        {
          recap_notes: transcriptText,
          status: "completed",
        },
        { where: { id: meetingId } }
      );
    }

    // 3. Cleanup temp uploaded audio file
    if (fs.existsSync(audioFile.path)) {
      fs.unlink(audioFile.path, (err) => {
        if (err) console.error("Error deleting temp audio file:", err);
      });
    }

    return { transcript: transcriptText };
  } catch (error) {
    // Exception cleanup
    if (audioFile && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
    throw error;
  }
};

module.exports = {
  finalizeMeeting,
};