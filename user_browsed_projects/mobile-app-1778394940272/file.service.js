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
  });

  const projectRecord = await Project.findOne({
    where: { slug: projectId },
  });

  if (!projectRecord) {
    return res
      .status(404)
      .json({ error: "Project workspace not found in database." });
  }

  let projectRootPath = "";

  if (uploadSource === "local") {
    projectRootPath = path.join(
      __dirname, "..", "../user_browsed_projects", projectId);
  } else {
    projectRootPath = path.join(__dirname, "..", "../user_projects", projectId);
  }

  await projectRecord.update({
    folder_path: projectRootPath,
  });

  await fs.ensureDir(projectRootPath);

  for (const file of files) {
    const fullFilePath = path.join(projectRootPath, file.relativePath);

    await fs.ensureFile(fullFilePath);
    await fs.writeFile(fullFilePath, file.content, "utf-8");
  }

  return { success: true, destination: projectRootPath };
};

module.exports = {
  saveLocalProjectFiles,
};
