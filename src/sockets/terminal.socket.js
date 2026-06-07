const path = require("path");
const fs = require("fs");
const net = require("net");
const pty = require("node-pty");
const { exec } = require("child_process");
const util = require("util");
const db = require("../models/index");
const { getProjectMeta, registerRuntimePort } = require("../../projectDetector");

const execPromise = util.promisify(exec);
const PROJECTS_BASE_DIR = path.join(process.cwd(), "../../user_projects");

const activeFolderUsers = {};
const activeProjectWatchers = {};
const occupiedPorts = new Set();

const getProjectPath = async (projectId) => {
  const projectRecord = await db.Project.findOne({ where: { slug: projectId } });
  return projectRecord ? projectRecord.folder_path : null;
};

const checkPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => { server.close(); resolve(true); });
    server.listen(port);
  });
};

module.exports = (io, socket) => {
  if (!fs.existsSync(PROJECTS_BASE_DIR)) {
    fs.mkdirSync(PROJECTS_BASE_DIR);
  }

  const spawnTerminal = async (projectId, socket, isBrowsed = false) => {
    const projectPath = await getProjectPath(projectId);
    const parts = projectPath.split('/');
    parts.pop();
    const base_path = parts.join('/');
    const projectMeta = getProjectMeta(projectPath, projectId);
    const userId = projectId || "default_user_sdfsdf_111";

    const sshBaseDir = path.join(base_path, `../../user_keys/project_${userId}`);
    const privateKeyPath = path.join(sshBaseDir, "id_ed25519");

    try {
      if (fs.existsSync(sshBaseDir)) fs.rmSync(sshBaseDir, { recursive: true, force: true });
      fs.mkdirSync(sshBaseDir, { recursive: true });
      await execPromise(`ssh-keygen -t ed25519 -f "${privateKeyPath}" -N "" -C "ucollyx_${userId}" -q`);
      await execPromise(`chmod 700 "${sshBaseDir}"`);
      await execPromise(`chmod 600 "${privateKeyPath}"`);
    } catch (err) {
      console.error("❌ Key gen container issue:", err);
    }

    let targetPort = parseInt(projectMeta.port);
    while (true) {
      const isAvailable = await checkPortAvailable(targetPort);
      if (isAvailable && !occupiedPorts.has(targetPort)) break;
      targetPort++;
    }

    registerRuntimePort(projectId, targetPort);
    socket.emit("project:port-allocated", { port: targetPort });

    const containerName = `ucollyx_${projectId}_${socket.id}_${Date.now()}`;
    const publicKey = fs.readFileSync(`${privateKeyPath}.pub`, "utf8");
    socket.emit("project:ssh-key-ready", { publicKey });

    const ptyProcess = pty.spawn("docker", [
      "run", "-it", "--rm", "--name", containerName,
      "-p", `${targetPort}:${targetPort}`,
      "-v", `${projectPath}:/home/node`,
      "-v", `${sshBaseDir}:/home/node/.ssh`,
      "-w", "/home/node", "backend_backend", "bash"
    ], {
      name: "xterm-color", cols: 80, rows: 30,
      env: { ...process.env, PORT: targetPort.toString(), HOME: "/home/node" }
    });

    return ptyProcess;
  };

  socket.on("project:join", async ({ projectId, username }) => {
    if (!projectId) return;
    const roomName = `project_room:${projectId}`;
    socket.join(roomName);
    socket.username = username || `dev_${socket.id.slice(0, 4)}`;
    socket.currentProject = projectId;

    if (!activeFolderUsers[projectId]) activeFolderUsers[projectId] = {};
    const colors = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    activeFolderUsers[projectId][socket.id] = {
      name: socket.username, color: colors[Math.floor(Math.random() * colors.length)],
      socketId: socket.id, projectId
    };

    io.to(roomName).emit("project:users-update", Object.values(activeFolderUsers[projectId]));

    try {
      const actualProjectPath = await getProjectPath(projectId);
      if (actualProjectPath && !activeProjectWatchers[projectId]) {
        const chokidar = await import("chokidar");
        const watcher = chokidar.default.watch(actualProjectPath, { persistent: true, ignoreInitial: true });
        
        watcher.on("all", (event, filePath) => {
          const relativePath = path.relative(actualProjectPath, filePath);
          const parentFolder = path.dirname(relativePath);
          io.to(roomName).emit("file-tree-update", {
            event, path: relativePath, parent: parentFolder === "." ? "root" : parentFolder
          });
        });
        activeProjectWatchers[projectId] = watcher;
      }
    } catch (e) { console.error("Watcher error:", e.message); }
  });

  socket.on("file:join", ({ projectId, filePath, username }) => {
    socket.join(`file_room:${projectId}:${filePath}`);
    socket.username = username || `Dev_${socket.id.slice(0, 4)}`;
    socket.currentFile = filePath;
    socket.currentProject = projectId;
  });

  socket.on("code:update", ({ projectId, filePath, content }) => {
    socket.to(`file_room:${projectId}:${filePath}`).emit("code:update", { filePath, content });
  });

  socket.on("cursor:move", ({ projectId, filePath, cursorPosition }) => {
    socket.to(`file_room:${projectId}:${filePath}`).emit("cursor:update", {
      socketId: socket.id, username: socket.username, filePath, cursorPosition
    });
  });

  socket.on("terminal:init", async (payload) => {
    let projectId = payload?.projectId || payload;
    let isBrowsed = payload?.isBrowsed || false;
    if (!projectId) return;

    if (socket.ptyProcess) {
      if (socket.allocatedPort) occupiedPorts.delete(socket.allocatedPort);
      socket.ptyProcess.kill();
    }

    try {
      const ptyProcess = await spawnTerminal(projectId, socket, isBrowsed);
      socket.ptyProcess = ptyProcess;
      ptyProcess.onData((data) => socket.emit("terminal:data", data));
      ptyProcess.on("exit", () => socket.emit("terminal:data", "\r\n[UCollyx Container Exited]\r\n"));
    } catch (err) {
      socket.emit("terminal:data", `\r\n❌ Deployment Failure: ${err.message}\r\n`);
    }
  });

  socket.on("terminal:write", (data) => {
    if (socket.ptyProcess) socket.ptyProcess.write(data);
  });

  socket.on("project:leave", ({ projectId }) => {
    if (projectId && activeFolderUsers[projectId]?.[socket.id]) {
      delete activeFolderUsers[projectId][socket.id];
      if (activeProjectWatchers[projectId]) {
        activeProjectWatchers[projectId].close();
        delete activeProjectWatchers[projectId];
      }
      io.to(`project_room:${projectId}`).emit("project:users-update", Object.values(activeFolderUsers[projectId]));
    }
  });

  // 🎯 CRITICAL SYSTEM HARD CLEANUP ON CONNECTION DROP
  socket.on("disconnect", () => {
    // 1. Kill isolated Docker shell process smoothly
    if (socket.ptyProcess) {
      console.log(`🔌 Shell Instance Terminated for: ${socket.id}`);
      socket.ptyProcess.kill();
    }
    
    // 2. Remove user from workspace active listings
    const pId = socket.currentProject;
    if (pId && activeFolderUsers[pId]?.[socket.id]) {
      delete activeFolderUsers[pId][socket.id];
      
      // If project room gets empty, close file tree chokidar system
      if (Object.keys(activeFolderUsers[pId]).length === 0) {
        if (activeProjectWatchers[pId]) {
          activeProjectWatchers[pId].close();
          delete activeProjectWatchers[pId];
        }
      } else {
        io.to(`project_room:${pId}`).emit("project:users-update", Object.values(activeFolderUsers[pId]));
      }
    }
  });
};