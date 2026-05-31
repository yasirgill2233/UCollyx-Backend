const fs = require("fs-extra");
const path = require("path");
const { Project } = require("../models");

const saveLocalProjectFiles = async (
  projectId,
  files,
  userId,
  uploadSource,
) => {
  console.log("Saving local project files with data:", {
    uploadSource,
    totalItems: files ? files.length : 0
  });

  
  // 1. Find Project Record
  const projectRecord = await Project.findOne({
    where: { slug: projectId },
  });

  // 🎯 FIX 1: Express 'res' remove kiya aur Error throw kiya taake controller isay catch kare
  if (!projectRecord) {
    throw new Error("Project workspace not found in database.");
  }

  let projectRootPath = "";

  // Dynamic root selection
  if (uploadSource === "local") {
    projectRootPath = path.resolve(__dirname, "../../user_browsed_projects", projectId+"_"+userId);
  } else {
    projectRootPath = path.resolve(__dirname, "../../user_projects", projectId);
  }
  
  console.log("Project ID:================================================================", projectRootPath+"_"+userId);

  // 2. Update Database Folder Path
  await projectRecord.update({
    folder_path: projectRootPath,
  });

  // 3. Ensure Root Directory Exists
  await fs.ensureDir(projectRootPath);

  // 🎯 FIX 2: Check array before loop to prevent crash
  if (files && Array.isArray(files)) {
    for (const item of files) {
      const fullPhysicalPath = path.join(projectRootPath, item.relativePath);

      // 📂 Case A: Agar item folder hai (Chahe khali ho ya bhara hua)
      if (item.type === "folder") {
        await fs.ensureDir(fullPhysicalPath);
        console.log(`📁 Directory created on disk: ${item.relativePath}`);
      } 
      // 📄 Case B: Agar item file hai
      else {
        await fs.ensureFile(fullPhysicalPath);
        await fs.writeFile(fullPhysicalPath, item.content || "", "utf-8");
      }
    }
  }

  return { success: true, destination: projectRootPath };
};

module.exports = {
  saveLocalProjectFiles,
};