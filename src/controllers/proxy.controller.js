const path = require("path");
const httpProxy = require("http-proxy");
const { getProjectMeta } = require("../../projectDetector");

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
});

proxy.on("error", (err, req, res) => {
  console.error("========== PROXY ERROR ==========");
  console.error(err);
  console.error("=================================");

  if (!res.headersSent) {
    res.status(503).send("Sandbox is starting...");
  }
});

const handlePreview = (req, res) => {
  const host = req.hostname.toLowerCase();

  if (!host.endsWith(".preview.ucollyx.com")) {
    return res.status(400).send("Invalid Preview Host");
  }

  const projectId = host.replace(".preview.ucollyx.com", "");

  const projectPath = path.join(__dirname, "..", "user_projects", projectId);
  const projectMeta = getProjectMeta(projectPath, projectId);

  if (!projectMeta || !projectMeta.port) {
    return res.status(200).send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px; background:#09090b; color:#a1a1aa; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
               <div style="width:24px; height:24px; border:3px solid #3b82f6; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-bottom:12px;"></div>
               <h3 style="color:#f4f4f5; margin-bottom:8px;">Allocating Sandbox Environment...</h3>
               <p style="font-size:12px; color:#71717a;">UCollyx is searching a secure port for your container. Please refresh in a second.</p>
               <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </div>
        `);
  }

  const targetUrl = `http://localhost:${projectMeta.port}`;

  if (req.url === "") {
    req.url = "/";
  }

  console.log("Host:", req.hostname);
  console.log("Project:", projectId);
  console.log("URL:", req.url);
  console.log("Target:", targetUrl);
  console.log(projectMeta);

  proxy.web(req, res, {
    target: targetUrl,
    proxyTimeout: 300000,
    timeout: 300000,
  });
};

module.exports = {
  handlePreview,
  proxyInstance: proxy,
};
