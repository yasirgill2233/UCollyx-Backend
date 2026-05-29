const path = require('path');

const httpProxy = require('http-proxy');
const { getProjectMeta } = require('../../projectDetector');

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true 
});

// app.js - Optimized Reverse Proxy
const handlePreview = (req, res) => {
    const pathParts = req.url.split('/').filter(Boolean);
    const projectId = pathParts[0]; 

    if (!projectId) {
        return res.status(400).send("Project ID / Slug is missing in preview URL.");
    }

    const projectPath = path.join(__dirname, '..', 'user-projects', projectId); 

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

    const prefix = `/${projectId}`;
    if (req.url.startsWith(prefix)) {
        req.url = req.url.slice(prefix.length);
    }
    if (req.url === '' || !req.url.startsWith('/')) {
        req.url = '/' + req.url;
    }

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
};


module.exports = {
    handlePreview
};