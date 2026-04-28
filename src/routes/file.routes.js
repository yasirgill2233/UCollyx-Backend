const express = require('express');
const router = express.Router();

const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '../user_projects'); // User projects ka base folder
if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

const initializeProject = async () => {
    try {
        await fs.ensureDir(rootDir);
        
        const files = await fs.readdir(rootDir);
        if (files.length === 0) {
            await fs.writeFile(path.join(rootDir, 'index.js'), '// Welcome to UCollyx\nconsole.log("Happy Coding!");');
            await fs.writeFile(path.join(rootDir, 'styles.css'), 'body { background: #000; color: #fff; }');
            console.log("Default project files created in user_projects/");
        }
    } catch (err) {
        console.error("Initialization Error:", err);
    }
};

initializeProject();

const getFileTree = async (dirPath) => {
    const stats = await fs.stat(dirPath);
    const info = {
        id: dirPath,
        name: path.basename(dirPath),
    };

    if (stats.isDirectory()) {
        info.type = 'folder';
        const children = await fs.readdir(dirPath);
        info.children = await Promise.all(
            children.map(child => getFileTree(path.join(dirPath, child)))
        );
    } else {
        info.type = 'file';
    }
    return info;
};

router.get('/tree', async (req, res) => {
    try {
        const { projectId } = req.query;
        const targetPath = path.join(rootDir, projectId);

        console.log(`Requested tree for project: ${projectId} at path: ${targetPath}`);

        if (!fs.existsSync(targetPath)) {
            return res.json({ id: projectId, name: projectId, children: [] });
        }

        const tree = await getFileTree(targetPath);
        res.json(tree);
    } catch (err) {
        console.error("Tree Error:", err);
        res.status(500).json({ error: "Failed to load project tree" });
    }
});

router.post('/content', async (req, res) => {
    const { path } = req.body;
    try {
        if (!path.startsWith(rootDir)) return res.status(403).send("Access Denied");
        
        const content = await fs.readFile(path, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/save', async (req, res) => {
    const { path: filePath, content } = req.body;

    try {
        if (!filePath.startsWith(rootDir)) {
            return res.status(403).json({ error: "Access Denied: Path outside root" });
        }
        
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(`Saved: ${path.basename(filePath)}`);
        res.json({ message: 'File saved successfully' });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: err.message });
    }
});


router.post('/create', async (req, res) => {
    const { parentPath, name, type } = req.body;

    console.log( "parentPath:", parentPath, "name:", name, "type:", type);

    const fullPath = path.resolve(rootDir, parentPath, name);

    console.log("Full path:",fullPath)

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
});

router.post('/delete', async (req, res) => {
    const { path: itemPath } = req.body;
    try {
        await fs.remove(itemPath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;