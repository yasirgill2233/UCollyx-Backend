const { AssemblyAI } = require('assemblyai');
const cloudinary = require('cloudinary').v2;

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET 
});

const processMeetingData = async (filePath) => {
  try {
    const upload = await cloudinary.uploader.upload(filePath, { 
      resource_type: "video",
      folder: "ucollyx_meetings" 
    });

    const transcript = await client.transcripts.transcribe({ 
        audio: filePath,
        language_detection: true
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