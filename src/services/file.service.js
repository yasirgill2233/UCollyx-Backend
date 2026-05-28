const fs = require('fs-extra');
const path = require('path');

/**
 * Local files ko server par physical storage memory me save karne ka function
 */
const saveLocalProjectFiles = async (projectId, files) => {
  // Path adjustment aapki folder structure ke mutabik (root folder me user_projects tak)
//   const PROJECTS_BASE_DIR = path.join(process.cwd(), "user_projects");
//       const relativePath = path.relative(PROJECTS_BASE_DIR, filePath);
//       const parentFolder = path.dirname(relativePath);

console.log("Saving project files for projectId:", projectId, files);

  const projectRootPath = path.join(__dirname, '..', 'user_projects', projectId);

  // 1. Ensure root directory completely clean aur secure ban jaye
  await fs.ensureDir(projectRootPath);

  // 2. Flat loop logic se dynamic folders aur sub-files write karein
  for (const file of files) {
    const fullFilePath = path.join(projectRootPath, file.relativePath);
    
    // fs-extra deep nested paths khud ba khud handle kar lega
    await fs.ensureFile(fullFilePath); 
    await fs.writeFile(fullFilePath, file.content, 'utf-8');
  }

  return { success: true, destination: projectRootPath };
};

module.exports = {
  saveLocalProjectFiles
};