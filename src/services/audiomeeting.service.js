// services/meetingService.js
const fs = require("fs");
const Groq = require("groq-sdk");
const { Meeting, Message } = require("../models"); // Sequelize/ORM Meeting Model

// Jab Jitsi Meeting finalize / close ho jaye:
const finalizeMeeting1 = async (req, res) => {
  try {
    const { meetingId } = req.body;
    const transcriptText = req.transcript || "Meeting completed"; // Jo Whisper AI se transcript aye

    // Database mein record update karein
    const updatedMeeting = await Meeting.update(
      {
        status: "completed",
        end_time: new Date(), // End time mark karne ke liye
        recap_notes: transcriptText, // Transcript save karne ke liye
      },
      {
        where: { id: meetingId },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Meeting closed and status updated to completed.",
      data: updatedMeeting,
    });
  } catch (error) {
    console.error("Error updating meeting status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

    const transcriptText =
      transcription.text || "No speech detected in recorded audio.";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an executive AI assistant. Take the meeting transcript provided by the user and summarize it into clear, highly professional bullet points. 
          
Structure your response as follows:
📌 **Key Discussion Points** (Bullet points)
✅ **Action Items & Decisions Made** (Bullet points)
📝 **Brief Executive Summary** (2-3 sentences)`,
        },
        {
          role: "user",
          content: `Here is the raw meeting transcript:\n\n"${transcriptText}"`,
        },
      ],
      model: "llama-3.3-70b-versatile", // Fast and highly accurate model
      temperature: 0.3,
    });

    const summarizedNotes =
      completion.choices[0]?.message?.content || rawTranscript;

    // 2. Database update: Save transcript to recap_notes
    if (meetingId) {
      await Message.update(
        {
          transcript: transcriptText,
          status: "ended",
        },
        { where: { id: meetingId } },
      );
    }

    if (meetingId) {
      await Meeting.update(
        {
          status: "completed",
          end_time: new Date(), // End time mark karne ke liye
          recap_notes: transcriptText, // Transcript save karne ke liye
        },
        {
          where: { id: meetingId },
        },
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
