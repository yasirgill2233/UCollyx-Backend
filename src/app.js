const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const fs = require('fs-extra');
const path = require('path');

const rootDir = path.join(__dirname, '../user_projects'); // User projects ka base folder
if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir);

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.route');
const projectRoutes = require('./routes/project.routes');
const gitRoute = require('./routes/gitRoute.routes');

const app = express();

// Global Middlewares
app.use(helmet()); // Security headers ke liye
app.use(cors());   // Cross-origin requests allow karne ke liye
app.use(morgan('dev')); // Console mein requests log karne ke liye
app.use(express.json()); // JSON data handle karne ke liye

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/projects', projectRoutes);
app.use('/api/git', gitRoute);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    console.log('API is running successfully!');
    res.status(200).send('API is running successfully!');
});


// --- Step A: Folder and Dummy Files Creation ---
const initializeProject = async () => {
    try {
        await fs.ensureDir(rootDir); // Folder banayega agar nahi hai
        
        // Agar folder khali hai toh dummy files banao
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



// 1. Recursive function to get file tree
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

app.get('/api/files/tree', async (req, res) => {
    try {
        const { projectId } = req.query;
        const targetPath = path.join(rootDir, projectId);

        console.log(`Requested tree for project: ${projectId} at path: ${targetPath}`); // Debugging ke liye

        // 1. Check if it exists before trying to read it
        if (!fs.existsSync(targetPath)) {
            // If it doesn't exist, maybe return an empty structure instead of crashing
            return res.json({ id: projectId, name: projectId, children: [] });
        }

        // 2. Wrap your existing tree logic in a try-catch to prevent a 500
        const tree = await getFileTree(targetPath);
        res.json(tree);
    } catch (err) {
        console.error("Tree Error:", err);
        res.status(500).json({ error: "Failed to load project tree" });
    }
});

app.post('/api/files/content', async (req, res) => {
    const { path } = req.body;
    try {
        // Security check: Path rootDir ke bahar na jaye
        if (!path.startsWith(rootDir)) return res.status(403).send("Access Denied");
        
        const content = await fs.readFile(path, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/files/save', async (req, res) => {
    const { path: filePath, content } = req.body; // Key ko match kiya (path)

    try {
        // Security Check: Ensure file is within user_projects
        if (!filePath.startsWith(rootDir)) {
            return res.status(403).json({ error: "Access Denied: Path outside root" });
        }
        
        // File write karein
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(`✅ Saved: ${path.basename(filePath)}`);
        res.json({ message: 'File saved successfully' });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: err.message });
    }
});


// Backend: Create File or Folder
app.post('/api/files/create', async (req, res) => {
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

app.post('/api/files/delete', async (req, res) => {
    const { path: itemPath } = req.body;
    try {
        await fs.remove(itemPath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = app;