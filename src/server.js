const http = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty");
const os = require("os");
const app = require("./app");
const dotenv = require("dotenv");
const db = require("./models/index");
const path = require("path");
const fs = require("fs");
const net = require("net");

const { exec } = require("child_process");
const util = require("util");

const { getProjectMeta, registerRuntimePort } = require("../projectDetector");

const activeFileUsers = {};
const activeFolderUsers = {};

const execPromise = util.promisify(exec);

const { execSync } = require("child_process");

const getContainerId = () => {
  try {
    return execSync("docker ps -q -f ancestor=backend_backend")
      .toString()
      .trim();
  } catch (e) {
    return null;
  }
};

const containerId = getContainerId();
if (!containerId) throw new Error("Container is not running!");

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PROJECTS_BASE_DIR = path.join(process.cwd(), "user_projects");

async function startFileWatcher() {
  const chokidar = await import("chokidar");
  const watcher = chokidar.default.watch(PROJECTS_BASE_DIR, {
    persistent: true,
  });

  watcher.on("all", (event, filePath) => {
    const relativePath = path.relative(PROJECTS_BASE_DIR, filePath);
    const parentFolder = path.dirname(relativePath);
    io.emit("file-tree-update", {
      event,
      path: relativePath,
      parent: parentFolder === "." ? "root" : parentFolder,
    });
  });
}

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

io.on("connection", (socket) => {
  if (!fs.existsSync(PROJECTS_BASE_DIR)) {
    fs.mkdirSync(PROJECTS_BASE_DIR);
  }

  const getProjectPath = (projectId) => {
    return path.join(PROJECTS_BASE_DIR, projectId);
  };

  const occupiedPorts = new Set();

  const checkPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close();
        resolve(true);
      });
      server.listen(port);
    });
  };

  const spawnTerminal = async (projectId, socket) => {
    const projectPath = path.join(PROJECTS_BASE_DIR, projectId);

    // let targetPort = 5178;

    const projectMeta = getProjectMeta(projectPath, projectId);

    console.log(
      "###############################################################################",
      projectId,
    );

    const userId = projectId || "default_user_sdfsdf_111";

    const sshBaseDir = path.join(
      PROJECTS_BASE_DIR,
      `../user_keys/project_${userId}`,
    );
    const privateKeyPath = path.join(sshBaseDir, "id_ed25519");

    console.log(`📂 Generating for: project_${userId}`);

    try {
      if (fs.existsSync(sshBaseDir)) {
        fs.rmSync(sshBaseDir, { recursive: true, force: true });
      }

      fs.mkdirSync(sshBaseDir, { recursive: true });

      await execPromise(
        `ssh-keygen -t ed25519 -f "${privateKeyPath}" -N "" -C "ucollyx_${userId}" -q`,
      );

      await execPromise(`chmod 700 "${sshBaseDir}"`);
      await execPromise(`chmod 600 "${privateKeyPath}"`);
      await execPromise(`chmod 644 "${privateKeyPath}.pub"`);

      console.log(
        `✨ [SUCCESS] Bilkul nayi unique key ban gayi hai project_${userId} ke liye!`,
      );
    } catch (err) {
      console.error("❌ Key generation mein masla aaya:", err);
    }

    let targetPort = parseInt(projectMeta.port);

    while (true) {
      const isAvailable = await checkPortAvailable(targetPort);
      if (isAvailable && !occupiedPorts.has(targetPort)) {
        break;
      }
      targetPort++;
    }

    registerRuntimePort(projectId, targetPort);

    socket.emit("project:port-allocated", { port: targetPort });

    console.log(
      `🐳 Isolated Sandbox: Container allocated on live port [${targetPort}]`,
    );

    const containerName = `ucollyx_${projectId}_${socket.id}_${Date.now()}`;

    // Public key read karna frontend par display karwane ke liye (Optional, agar socket pe bhejna ho)
    const publicKey = fs.readFileSync(`${privateKeyPath}.pub`, "utf8");
    socket.emit("project:ssh-key-ready", { publicKey });

    const ptyProcess = pty.spawn(
      "docker",
      [
        "run",
        "-it",
        "--rm",
        "--name",
        containerName,
        "-p",
        `${targetPort}:${targetPort}`,
        "-v",
        `${projectPath}:/home/node`,
        "-v",
        `${sshBaseDir}:/home/node/.ssh`,
        "-w",
        "/home/node",
        "backend_backend",
        "bash",
      ],
      {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        env: {
          ...process.env,
          PORT: targetPort.toString(),
          HOME: "/home/node",
        },
      },
    );

    return ptyProcess;
  };

  console.log(`🔌 New User Connected to Socket Workspace: ${socket.id}`);

  socket.on("file:join", ({ projectId, filePath, username }) => {
    socket.join(`file_room:${projectId}:${filePath}`);

    socket.username = username || `Dev_${socket.id.slice(0, 4)}`;
    socket.currentFile = filePath;
    socket.currentProject = projectId;

    console.log(`👥 ${socket.username} joined collaboration for: ${filePath}`);
  });

  socket.on("project:join", ({ projectId, username }) => {
    if (!projectId) return;

    const roomName = `project_room:${projectId}`;
    socket.join(roomName); // User ko project ke numeric room mein enter karwao

    socket.username = username || `dev_${socket.id.slice(0, 4)}`;
    socket.currentProject = projectId;

    // Memory block initialization safely
    if (!activeFolderUsers[projectId]) {
      activeFolderUsers[projectId] = {};
    }

    // Soft UI colorful avatar dynamic palette selection
    const colors = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // User metadata mapping save karein block par
    activeFolderUsers[projectId][socket.id] = {
      name: socket.username,
      color: randomColor,
      socketId: socket.id,
      projectId: projectId,
    };

    console.log(
      `👥 ${socket.username} joined workspace project space: ${projectId}`,
    );

    // 🚀 PROJECT ROOM BROADCAST: Is project room ke sab connected logo ko updated list bhejo
    io.to(roomName).emit(
      "project:users-update",
      Object.values(activeFolderUsers[projectId]),
    );
  });

  // Jab user file leave kare ya socket disconnect ho
  socket.on("file:leave", ({ projectId, filePath }) => {
    const roomName = `file_room:${projectId}:${filePath}`;
    socket.leave(roomName);

    if (activeFolderUsers[projectId]?.[filePath]?.[socket.id]) {
      delete activeFolderUsers[projectId][filePath][socket.id];

      // Updated list baqi logo ko bhejo
      io.to(roomName).emit(
        "file:active-users-updated",
        Object.values(activeFolderUsers[projectId][filePath]),
      );
    }
  });

  socket.on("project:leave", ({ projectId }) => {
    if (!projectId) return;

    const roomName = `project_room:${projectId}`;
    socket.leave(roomName); // User ko project ke room se exit karwao

    // Check karo kya user memory registry mein majood ha
    if (activeFolderUsers[projectId]?.[socket.id]) {
      const leavingUser = activeFolderUsers[projectId][socket.id];

      // Memory dabba saaf karo
      delete activeFolderUsers[projectId][socket.id];
      console.log(
        `🏃 Explicit Leave: ${leavingUser.name} left project space: ${projectId}`,
      );

      // Agar room bilkul khali ho jaye toh project key hi delete kar do, warna baki connected users ko list broadcast karo
      if (Object.keys(activeFolderUsers[projectId]).length === 0) {
        delete activeFolderUsers[projectId];
      } else {
        io.to(roomName).emit(
          "project:users-update",
          Object.values(activeFolderUsers[projectId]),
        );
      }
    }
  });

  socket.on("project:init-runtime", ({ projectId, userPort }) => {
    if (projectId && userPort) {
      registerRuntimePort(projectId, userPort);
      socket.currentProjectPort = parseInt(userPort, 10);
      socket.currentProjectId = projectId;
    }
  });

  socket.on("code:update", ({ projectId, filePath, content }) => {
    socket.to(`file_room:${projectId}:${filePath}`).emit("code:update", {
      filePath,
      content,
    });
  });

  socket.on("cursor:move", ({ projectId, filePath, cursorPosition }) => {
    const targetRoom = `file_room:${projectId}:${filePath}`;

    // 🔍 DEBUG LOGS: Terminal par live dekhne ke liye
    console.log(`----------------------------------------`);
    console.log(`🎯 [CURSOR MOVE] User: ${socket.username || "Unknown"}`);
    console.log(`📁 File: ${filePath}`);
    console.log(`🏠 Sending to Room: ${targetRoom}`);

    socket.to(targetRoom).emit("cursor:update", {
      socketId: socket.id,
      username: socket.username,
      filePath,
      cursorPosition,
    });
  });

  socket.on("file:leave", ({ projectId, filePath }) => {
    socket.leave(`file_room:${projectId}:${filePath}`);
    socket
      .to(`file_room:${projectId}:${filePath}`)
      .emit("cursor:remove", { socketId: socket.id });
  });

  socket.on("terminal:init", async (projectId) => {
    if (socket.ptyProcess) {
      if (socket.allocatedPort) occupiedPorts.delete(socket.allocatedPort);
      socket.ptyProcess.kill();
    }

    try {
      const ptyProcess = await spawnTerminal(projectId, socket);
      socket.ptyProcess = ptyProcess;

      ptyProcess.onData((data) => {
        socket.emit("terminal:data", data);
      });

      ptyProcess.on("exit", (code) => {
        if (socket.allocatedPort) {
          occupiedPorts.delete(socket.allocatedPort);
        }
        socket.emit(
          "terminal:data",
          "\r\n[UCollyx Isolated Container Exited]\r\n",
        );
      });
    } catch (error) {
      socket.emit(
        "terminal:data",
        `\r\n❌ Container Launch Failed: ${error.message}\r\n`,
      );
    }
  });

  socket.on("terminal:write", (data) => {
    if (data.includes("--port")) {
      const parts = data.split(" ");
      const portIndex = parts.indexOf("--port");

      if (portIndex !== -1 && parts[portIndex + 1]) {
        const detectedPort = parts[portIndex + 1].replace(/[^0-9]/g, "");
        const currentProjectSlug = socket.projectId;
        registerRuntimePort(currentProjectSlug, detectedPort);
      }
    }

    if (socket.ptyProcess) {
      socket.ptyProcess.write(data);
    }
  });

  socket.on("terminal:resize", ({ cols, rows }) => {
    if (socket.ptyProcess && cols && rows) {
      socket.ptyProcess.resize(cols, rows);
    }
  });

  socket.on("disconnect", () => {
    if (socket.ptyProcess) {
      socket.ptyProcess.kill();
    }
    if (socket.allocatedPort) {
      console.log(`♻️ Freeing up port: ${socket.allocatedPort}`);
      occupiedPorts.delete(socket.allocatedPort);
    }
    const projectId = socket.currentProject;

    if (projectId && activeFolderUsers[projectId]?.[socket.id]) {
      const roomName = `project_room:${projectId}`;

      // User data memory se trace clear karein
      delete activeFolderUsers[projectId][socket.id];

      console.log(`🏃‍♂️ User left project space context: ${projectId}`);

      // Remaining connected developers list dispatch trigger
      io.to(roomName).emit(
        "project:users-update",
        Object.values(activeFolderUsers[projectId]),
      );
    }
    console.log("User Disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await startFileWatcher();
    await db.sequelize.authenticate();
    console.log("Database Connected & Synced!");

    // await db.sequelize.sync({ alter: true });

    server.listen(PORT, () => {
      console.log(`
            ################################################
                   Server listening on port: ${PORT} 
                   Socket.io (WebRTC + Terminal) is READY!
            ################################################
            `);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
