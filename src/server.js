const http = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty");
const os = require("os");
const app = require("./app");
const dotenv = require("dotenv");
const db = require("./models/index");
const path = require("path");
const fs = require("fs");

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

// git log --all --graph --pretty=format:'{"hash":"%h","parent":"%p","message":"%s","branch":"%d"}'

// const getGitGraphData = (projectId, callback) => {
//     const projectPath = path.join(PROJECTS_BASE_DIR, projectId);
    
//     const command = `git -C ${projectPath} log --all --graph --pretty=format:'{"hash":"%h","parent":"%p","message":"%s","refs":"%D"}'`;

//     exec(command, (error, stdout, stderr) => {
//         if (error) {
//             return callback(error, null);
//         }
        
//         const logs = stdout.split('\n').map(line => {
//             try {
//                 const cleanJson = line.replace(/[^\{]*(\{.*\})[^}]*/, '$1');
//                 return JSON.parse(cleanJson);
//             } catch (e) {
//                 return null;
//             }
//         }).filter(item => item !== null);

//         callback(null, logs);
//     });
// };

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

  const spawnTerminal = (projectId) => {
    const projectPath = getProjectPath(projectId);

    const containerName = "ucollyx-engine";

    if (!fs.existsSync(projectPath)) {
      try {
        fs.mkdirSync(projectPath, { recursive: true });
        console.log(`Directory created: ${projectPath}`);
      } catch (err) {
        console.error(
          `Permission Denied/Error creating ${projectPath}:`,
          err.message,
        );
        throw err;
      }
    }

    const containerPath = `/home/node/user_projects/${projectId}`;

    const ptyProcess = pty.spawn(
      "docker",
      [
        "run",
        "-it",
        "--rm",
        "-v",
        `${projectPath}:/home/node`,
        "-w",
        "/home/node",
        "backend_backend",
        "bash",
      ],
      {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        env: process.env,
      },
    );

    return ptyProcess;
  };

  // const spawnTerminal = (projectId) => {
  //   const projectPath = getProjectPath(projectId);

  //   // Folder check (jo tumne pehle banaya tha)
  //   if (!fs.existsSync(projectPath)) {
  //     fs.mkdirSync(projectPath, { recursive: true });
  //   }

  //   // Docker hata kar direct shell spawn karo
  //   const ptyProcess = pty.spawn(
  //     process.platform === "win32" ? "powershell.exe" : "bash",
  //     [],
  //     {
  //       name: "xterm-color",
  //       cols: 80,
  //       rows: 30,
  //       cwd: projectPath, // Yahan project ka path set ho gaya
  //       env: process.env,
  //     },
  //   );

  //   return ptyProcess;
  // };

  socket.on("terminal:init", (projectId) => {
    if (socket.ptyProcess) {
      socket.ptyProcess.kill();
      socket.ptyProcess = null;
    }

    const ptyProcess = spawnTerminal(projectId);
    socket.ptyProcess = ptyProcess;

    ptyProcess.onData((data) => {
      socket.emit("terminal:data", data);
    });

    ptyProcess.on("exit", (code) => {
      socket.emit("terminal:data");
    });
  });

  socket.on("terminal:write", (data) => {
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
    console.log("User Disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await startFileWatcher();
    await db.sequelize.authenticate();
    console.log("Database Connected & Synced!");

    // await db.sequelize.sync({ force: true });

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
