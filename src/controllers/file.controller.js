const path = require('path');
const fs = require('fs-extra');
const fileService = require('../services/file.service');
const { Project } = require('../models');

const BANNED_FILES_AND_FOLDERS = [
  ".ssh",
  ".npm",
  ".bash_history",
  ".git",            // Git metadata ko bhi filter karna behtar hai
  ".node_repl_history",
  "node_modules"     // Agar future mein heavy backend nodes hon toh yeh bhi safe zone mein rahe
];


const rootDir = path.join(__dirname, '../../user_projects');
if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

const initializeProject = async () => {
    try {
        await fs.ensureDir(rootDir);
        
        const files = await fs.readdir(rootDir);
        if (files.length === 0) {
            await fs.writeFile(path.join(rootDir, 'index.js'), '// Welcome to UCollyx\nconsole.log("Happy Coding!");');
            await fs.writeFile(path.join(rootDir, 'styles.css'), 'body { background: #000; color: #fff; }');
        }
    } catch (err) {
        console.error("Initialization Error:", err);
    }
};

initializeProject();

const uploadLocalProject = async (req, res) => {
  try {
    const { projectId, files, userId, uploadSource } = req.body;

    
    const result = await fileService.saveLocalProjectFiles(projectId, files, userId, uploadSource);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Controller caught service error:", error.message);
    return res.status(error.message.includes("not found") ? 404 : 500).json({ 
      error: error.message 
    });
  }
};


const getFileTree = async (dirPath) => {
  const stats = await fs.stat(dirPath);
  const info = {
    id: dirPath,
    name: path.basename(dirPath),
  };

  if (stats.isDirectory()) {
    info.type = 'folder';
    
    // 1. Directory ka content read karo
    const children = await fs.readdir(dirPath);
    
    // ⚡ FILTER ENGINE: Sirf wahi files aage jayengi jo banned list mein nahi hain
    const allowedChildren = children.filter(child => !BANNED_FILES_AND_FOLDERS.includes(child));
    
    // 2. Sirf safe files/folders ka tree recursively build karo
    info.children = await Promise.all(
      allowedChildren.map(child => getFileTree(path.join(dirPath, child)))
    );
  } else {
    info.type = 'file';
  }
  return info;
};

const getFileTreeHandler = async (req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({ 
                success: false, 
                error: "Project identity slug is required in query parameters." 
            });
        }
        
        const projectRecord = await Project.findOne({
          where: { slug: projectId } // Agar client se slug aa rha ha, nahi to code use kar lena
        });
        
        // const targetPath = path.join(rootDir, projectId);
        const targetPath = projectRecord.folder_path;

        if (!fs.existsSync(targetPath)) {
            return res.json({ id: projectId, name: projectId, children: [] });
        }

        const tree = await getFileTree(targetPath);
        res.json(tree);
    } catch (err) {
        console.error("Tree Error:", err);
        res.status(500).json({ error: "Failed to load project tree" });
    }
};

const getFileContentHandler = async (req, res) => {
    const { path } = req.body;
    try {
        if (!path) return res.status(403).send("Access Denied");
        
        const content = await fs.readFile(path, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const saveFileHandler = async (req, res) => {
    const { path: filePath, content } = req.body;

    try {
        if (!filePath) {
            return res.status(403).json({ error: "Access Denied: Path outside root" });
        }
        
        await fs.writeFile(filePath, content, 'utf-8');
        
        res.json({ message: 'File saved successfully' });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: err.message });
    }
};


const createFileHandler = async (req, res) => {
    const { parentPath, name, type } = req.body;

    const len = parentPath.split('/').length

    const projectRecord = await Project.findOne({
      where: { slug: parentPath }
    });
    
    const targetPath = len === 1 ? projectRecord?.folder_path: parentPath;
    
    const fullPath = path.resolve(targetPath, name);

    try {
        if (type === 'folder') {
            await fs.ensureDir(fullPath);
        } else {
            await fs.ensureFile(fullPath);
        }
        res.json({ success: true, message: `${type} created successfully` });
    } catch (err) {
        console.error("Creation Error:", err);
        res.status(500).json({ error: "Could not create item" });
    }
};

const deleteFileHandler = async (req, res) => {
    const { path: itemPath } = req.body;
    try {
        await fs.remove(itemPath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
  uploadLocalProject,
  getFileTreeHandler,
  getFileContentHandler,
  saveFileHandler,
  createFileHandler,
  deleteFileHandler
};