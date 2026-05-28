const fileService = require('../services/file.service');

/**
 * Controller function upload payload validate aur parse karne keliye
 */
const uploadLocalProject = async (req, res) => {
  try {
    const { projectId, files } = req.body;

    // Validation Guard
    if (!projectId || !files || !Array.isArray(files)) {
      return res.status(400).json({ 
        error: "Invalid payload. 'projectId' and 'files' array are required." 
      });
    }

    // Direct functional service handler execute call
    const result = await fileService.saveLocalProjectFiles(projectId, files);

    return res.status(200).json({
      success: true,
      message: "Project volume populated on server successfully!",
      data: result
    });

  } catch (error) {
    console.error("Error in fileController.uploadLocalProject:", error);
    return res.status(500).json({ 
      error: "Internal server error while writing local workspace to disk." 
    });
  }
};

module.exports = {
  uploadLocalProject
};