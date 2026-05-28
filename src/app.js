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
const channelRoutes = require('./routes/channel.routes');
const messageRoutes = require('./routes/message.routes');
const meetingRoutes = require('./routes/meeting.routes');
const notificationRoutes = require('./routes/notification.routes');
const taskRoute = require('./routes/task.routes');
const issueRoute = require('./routes/issue.routes');
const teamRoute = require('./routes/team.routes');
const gitRoute = require('./routes/gitRoute.routes');
const fileRoute = require('./routes/file.routes');

const app = express();

app.use(helmet()); // Security headers ke liye
app.use(cors());   // Cross-origin requests allow karne ke liye
app.use(morgan('dev')); // Console mein requests log karne ke liye
app.use(express.json()); // JSON data handle karne ke liye

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/projects', projectRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoute);
app.use('/api/team', teamRoute);
app.use('/api/issues', issueRoute);
app.use('/api/git', gitRoute);
app.use('/api/files', fileRoute);
// Avatars folder static mapping

// Logos folder static mapping
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));
app.use('/uploads/logos', express.static(path.join(__dirname, '../uploads/logos')));
app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio')));
app.use('/uploads/attachments', express.static(path.join(__dirname, '../uploads/attachments')));
app.use('/uploads/issues', express.static(path.join(__dirname, '../uploads/issues')));

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

app.get('/api/files/tree', async (req, res) => {
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

app.post('/api/files/content', async (req, res) => {
    const { path } = req.body;
    try {
        if (!path.startsWith(rootDir)) return res.status(403).send("Access Denied");
        
        const content = await fs.readFile(path, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/files/save', async (req, res) => {
    const { path: filePath, content } = req.body;

    try {
        if (!filePath.startsWith(rootDir)) {
            return res.status(403).json({ error: "Access Denied: Path outside root" });
        }
        
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(`✅ Saved: ${path.basename(filePath)}`);
        res.json({ message: 'File saved successfully' });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: err.message });
    }
});


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

const httpProxy = require('http-proxy');
const { getProjectMeta } = require('../projectDetector'); // 👈 Import shared utility

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true 
});

// app.js - Optimized Reverse Proxy
app.use('/preview', (req, res) => {
    const pathParts = req.url.split('/').filter(Boolean);
    const projectId = pathParts[0]; 

    if (!projectId) {
        return res.status(400).send("Project ID / Slug is missing in preview URL.");
    }

    const projectPath = path.join(__dirname, '..', 'user-projects', projectId); 

    // 🔥 FIX: projectId ko bhi pass karein taake active runtime tracking cross verify ho sakay
    const projectMeta = getProjectMeta(projectPath, projectId);

    if (!projectMeta.port) {
    return res.status(200).send(`
        <div style="font-family:sans-serif; text-align:center; padding:50px; background:#09090b; color:#a1a1aa; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
           <div style="width:24px; height:24px; border:3px solid #3b82f6; border-top-color:transparent; border-radius:50%; animate:spin 1s linear infinite; margin-bottom:12px;"></div>
           <h3 style="color:#f4f4f5; margin-bottom:8px;">Allocating Sandbox Environment...</h3>
           <p style="font-size:12px; color:#71717a;">UCollyx is searching a secure, free port for your container. Please refresh in a second.</p>
           <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        </div>
    `);
}

    const targetUrl = `http://localhost:${projectMeta.port}`;

    // Req URL rewriting logic
    const prefix = `/${projectId}`;
    if (req.url.startsWith(prefix)) {
        req.url = req.url.slice(prefix.length);
    }
    if (req.url === '' || !req.url.startsWith('/')) {
        req.url = '/' + req.url;
    }

    // Proxy Execution Stream
    proxy.web(req, res, { target: targetUrl }, (err) => {
        console.error(`❌ Proxy Failed on port ${projectMeta.port}:`, err.message);
        
        const startCommand = projectMeta.type === 'laravel' ? "php artisan serve" : "npm run dev";
        res.status(503).send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px; background:#09090b; color:#a1a1aa; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
               <h3 style="color:#f4f4f5; margin-bottom:8px;">UCollyx Engine Loader</h3>
               <p style="font-size:12px; max-width:400px; line-height:1.6;">Terminal environment is ready on port <b>${projectMeta.port}</b>. Run <code style="background:#27272a; color:#f4f4f5; padding:2px 6px; border-radius:4px;">${startCommand}</code> inside the IDE terminal to compile live assets.</p>
            </div>
        `);
    });
});

module.exports = app;