const fs = require("fs");
const Groq = require("groq-sdk");
const { Meeting, Message } = require("../models");

const finalizeMeeting1 = async (req, res) => {
  try {
    const { meetingId } = req.body;
    const transcriptText = req.transcript || "Meeting completed";

    const updatedMeeting = await Meeting.update(
      {
        status: "completed",
        end_time: new Date(), 
        recap_notes: transcriptText,
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
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
    });

    const summarizedNotes =
      completion.choices[0]?.message?.content || rawTranscript;

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
          end_time: new Date(),
          recap_notes: transcriptText,
        },
        {
          where: { id: meetingId },
        },
      );
    }

    if (fs.existsSync(audioFile.path)) {
      fs.unlink(audioFile.path, (err) => {
        if (err) console.error("Error deleting temp audio file:", err);
      });
    }

    return { transcript: transcriptText };
  } catch (error) {
    if (audioFile && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
    throw error;
  }
};

module.exports = {
  finalizeMeeting,
};
