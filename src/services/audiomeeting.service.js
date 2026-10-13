const fs = require("fs");
const Groq = require("groq-sdk");
const { Meeting, Message } = require("../models");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const finalizeMeeting = async (audioFile, meetingId) => {
  try {
    console.log(
      `🎙️ Processing dialogue-wise transcript for Meeting ID: ${meetingId}...`,
    );

    // 1. Whisper سے verbose_json لیں تاکہ وقت اور حصوں کا اندازہ ہو سکے
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.path),
      model: "whisper-large-v3",
      response_format: "verbose_json", // <-- Changed to verbose_json for segments/timing
      language: "en",
    });

    const transcriptText =
      transcription.text || "No speech detected in recorded audio.";
    // اگر آپ کے پاس سیگمنٹس موجود ہیں تو انہیں بھی استعمال کر سکتے ہیں
    const segments = transcription.segments || [];

    // 2. LLM کے ذریعے ڈائیلاگ وائز فارمیٹ بنانا
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert meeting assistant. Take the raw meeting transcript and convert it into a clean, dialogue-wise conversation format (e.g., Speaker 1, Speaker 2 based on context shifts). 
          
After the dialogue transcript, provide a professional summary. Structure your response strictly as follows:

**Dialogue-wise Transcript**
[Speaker 1]: ...
[Speaker 2]: ...

**Key Discussion Points**
- ...

**Action Items & Decisions Made**
- ...

**Brief Executive Summary**
(2-3 sentences)`,
        },
        {
          role: "user",
          content: `Here is the raw meeting transcription:\n\n"${transcriptText}"`,
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
    });

    const processedOutput =
      completion.choices[0]?.message?.content || transcriptText;

    // 3. Database Updates (Dialogue transcript کو save کریں)
    if (meetingId) {
      await Message.update(
        {
          transcript: processedOutput, // ڈائیلاگ اور سُمری دونوں یہاں محفوظ ہو جائیں گے
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
          recap_notes: processedOutput,
        },
        {
          where: { id: meetingId },
        },
      );
    }

    // 4. Cleanup temp audio file
    if (fs.existsSync(audioFile.path)) {
      fs.unlink(audioFile.path, (err) => {
        if (err) console.error("Error deleting temp audio file:", err);
      });
    }

    return { transcript: processedOutput };
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
