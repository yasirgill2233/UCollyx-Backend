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
    return res.status(503).send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Starting Sandbox...</title>

<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    background:#09090b;
    font-family:Inter,Segoe UI,sans-serif;
    color:white;

    display:flex;
    justify-content:center;
    align-items:center;

    width:100vw;
    height:100vh;
    overflow:hidden;
}

.card{

    width:420px;
    max-width:90%;

    background:#18181b;

    border:1px solid rgba(255,255,255,.08);

    border-radius:18px;

    padding:40px;

    text-align:center;

    box-shadow:
        0 0 60px rgba(59,130,246,.15);

}

.logo{

    width:70px;
    height:70px;

    margin:auto;
    margin-bottom:25px;

    border-radius:50%;

    border:4px solid #3b82f6;
    border-top-color:transparent;

    animation:spin .9s linear infinite;

}

h2{

    font-size:24px;
    margin-bottom:12px;

}

p{

    color:#a1a1aa;
    line-height:1.7;

}

.progress{

    margin-top:30px;

    width:100%;
    height:8px;

    background:#27272a;

    border-radius:20px;

    overflow:hidden;

}

.bar{

    height:100%;

    width:35%;

    border-radius:20px;

    background:linear-gradient(
        90deg,
        #2563eb,
        #3b82f6,
        #60a5fa
    );

    animation:loading 1.3s infinite;
}

small{

    display:block;
    margin-top:25px;
    color:#71717a;
    font-size:13px;

}

@keyframes loading{

0%{
transform:translateX(-120%);
}

100%{
transform:translateX(320%);
}

}

@keyframes spin{

100%{
transform:rotate(360deg);
}

}
</style>

</head>

<body>

<div class="card">

<div class="logo"></div>

<h2>Starting Sandbox...</h2>

<p>
Your project container is being initialized.<br>
This usually takes only a few seconds.
</p>

<div class="progress">
<div class="bar"></div>
</div>

<small>
Powered by <b>UCollyx Sandbox Engine</b>
</small>

</div>

</body>
</html>
`);
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
