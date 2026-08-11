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

  const projectRecord = await Project.findOne({
    where: { slug: projectId },
  });

  if (!projectRecord) {
    throw new Error("Project workspace not found in database.");
  }

  let projectRootPath = "";

  if (uploadSource === "local") {
    projectRootPath = path.resolve(__dirname, "../../user_browsed_projects", projectId+"_"+userId);
  } else {
    projectRootPath = path.resolve(__dirname, "../../user_projects", projectId);
  }

  await projectRecord.update({
    folder_path: projectRootPath,
  });

  await fs.ensureDir(projectRootPath);

  if (files && Array.isArray(files)) {
    for (const item of files) {
      const fullPhysicalPath = path.join(projectRootPath, item.relativePath);

      if (item.type === "folder") {
        await fs.ensureDir(fullPhysicalPath);
        console.log(`📁 Directory created on disk: ${item.relativePath}`);
      }
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