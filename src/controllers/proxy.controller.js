const path = require("path");
const httpProxy = require("http-proxy");
const { getProjectMeta } = require("../../projectDetector");

// const proxy = httpProxy.createProxyServer({
//   changeOrigin: true,
//   ws: true,
// });

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
  selfHandleResponse: true,
});

proxy.on("error", (err, req, res) => {
  if (res && !res.headersSent && typeof res.status === "function") {
    res.status(503).send("Proxy transmission temporarily interrupted.");
  }
});

proxy.on("proxyRes", (proxyRes, req, res) => {
  const chunks = [];

  proxyRes.on("data", (chunk) => {
    chunks.push(chunk);
  });

  proxyRes.on("end", () => {
    let body = Buffer.concat(chunks);

    const contentType = proxyRes.headers["content-type"] || "";

    if (contentType.includes("text/html")) {
      let html = body.toString("utf8");

      const projectId = req.params.projectId;
      const prefix = `/api/proxy/${projectId}`;

      html = html
        .replace(/"\/@vite\/client"/g, `"${prefix}/@vite/client"`)
        .replace(/"\/src\//g, `"${prefix}/src/`)
        .replace(/"\/node_modules\//g, `"${prefix}/node_modules/`)
        .replace(/"\/favicon\.svg"/g, `"${prefix}/favicon.svg"`)
        .replace(/"\/@react-refresh"/g, `"${prefix}/@react-refresh"`);

      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      return res.end(html);
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    res.end(body);
  });
});

const handlePreview = (req, res) => {
  const projectId = req.params.projectId;

  if (!projectId) {
    return res.status(400).send("Missing Project Slug.");
  }

  const projectPath = path.join(__dirname, "..", "user-projects", projectId);
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

  const prefix = `/api/proxy/${projectId}`;

  req.url = req.originalUrl.replace(prefix, "");

  if (req.url === "") {
    req.url = "/";
  }

  proxy.web(req, res, {
    target: targetUrl,
  });
};

module.exports = {
  handlePreview,
  proxyInstance: proxy,
};
