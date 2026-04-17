const http = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty"); // 1. Import node-pty
const os = require("os"); // OS check karne ke liye
const app = require("./app");
const dotenv = require("dotenv");
const db = require("./models/index");

dotenv.config();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Shell selection (Windows ke liye powershell, Linux ke liye bash)
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

// Socket.io Logic
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // --- EXISTING WEBRTC SIGNALING ---
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", {
      signal: data.signalData,
      from: socket.id,
    });
  });

  // --- NEW DOCKER TERMINAL LOGIC ---
  const ptyProcess = pty.spawn('docker', [
      'run',
      '-it',
      '--rm',
      // User ke current project ki directory ko container ke /workspace se link karein
      '-v', `${process.cwd()}:/workspace`, 
      '-w', '/workspace',
    //   'node:18-alpine',
    'ucollyx-engine',
      'sh' // Alpine mein bash nahi hota, 'sh' hota hai
  ], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      env: process.env
  });

  // Data Listeners
  ptyProcess.onData((data) => {
    socket.emit("terminal:data", data);
  });

  socket.on("terminal:write", (data) => {
    ptyProcess.write(data);
  });

  socket.on("terminal:resize", ({ cols, rows }) => {
    if (cols && rows) ptyProcess.resize(cols, rows);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
    ptyProcess.kill(); 

  });
});

const startServer = async () => {
  try {
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
