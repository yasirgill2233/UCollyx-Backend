const { AssemblyAI } = require('assemblyai');
const cloudinary = require('cloudinary').v2;

// AssemblyAI Client Setup
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

// Cloudinary Setup
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET 
});

const processMeetingData = async (filePath) => {
  try {
    // 1. Pehle Cloudinary pr upload krain (Permanent URL k liye)
    const upload = await cloudinary.uploader.upload(filePath, { 
      resource_type: "video", // Audio files k liye bhi 'video' use hota ha yahan
      folder: "ucollyx_meetings" 
    });

    // 2. AssemblyAI se Transcription krain
    const transcript = await client.transcripts.transcribe({ 
        audio: filePath,
        language_detection: true // Agar meeting Urdu/English mix ha to ye behtar ha
    });

    return {
      audioUrl: upload.secure_url,
      transcriptText: transcript.text
    };
  } catch (error) {
    throw new Error("AI Processing Failed: " + error.message);
  }
};

module.exports = { processMeetingData };