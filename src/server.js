// const http = require('http'); // Standard Node.js HTTP module
// const { Server } = require('socket.io'); // Socket.io import
// const app = require('./app');
// const dotenv = require('dotenv');
// const db = require('./models/index');

// dotenv.config();
// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// // 3. WebRTC Signaling Logic
// io.on('connection', (socket) => {
//     console.log('User Connected:', socket.id);

//     socket.on('join-room', (roomId) => {
//         socket.join(roomId);

//         socket.to(roomId).emit('user-joined', socket.id);
//     });

//     socket.on('signal', (data) => {
//         io.to(data.to).emit('signal', {
//             signal: data.signalData,
//             from: socket.id
//         });
//     });

//     socket.on('disconnect', () => {
//         console.log('User Disconnected');
//     });
// });

// const startServer = async () => {
//     try {
//         await db.sequelize.authenticate();
//         console.log('Database Connected & Synced!');

//         // await db.sequelize.sync({ force: true });

//         server.listen(PORT, () => {
//             console.log(`
//             ################################################
//                    Server listening on port: ${PORT}
//                    Socket.io is READY!
//             ################################################
//             `);
//         });
//     } catch (error) {
//         console.error('Failed to start server:', error.message);
//         process.exit(1);
//     }
// };

// startServer();

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

  // --- NEW TERMINAL LOGIC (STEP-BY-STEP) ---
  // Har user ke liye ek separate PTY process create hoga
  // const ptyProcess = pty.spawn(shell, [], {
  //     name: 'xterm-color',
  //     cols: 80,
  //     rows: 30,
  //     cwd: process.cwd(), // Project root directory
  //     env: process.env
  // });

  // Jab terminal connect ho:
  const ptyProcess = pty.spawn('docker', [
        'run',
        '-it',
        '--rm',                     // Kaam khatam hone par container delete ho jaye
        '-v', `${process.cwd()}/user_projects:/workspace`, // Files map karein
        '-w', '/workspace',         // Working directory
        'node:18-alpine',           // Image name
        'sh'                        // Shell type
    ], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        env: process.env
    });

  // PTY se data aaye to frontend ko bhej do
  ptyProcess.onData((data) => {
    socket.emit("terminal:data", data);
  });

  // Frontend se input aaye to PTY mein likh do
  socket.on("terminal:write", (data) => {
    ptyProcess.write(data);
  });

  // Terminal resize handle karne ke liye (Important for UI)
  socket.on("terminal:resize", ({ cols, rows }) => {
    ptyProcess.resize(cols, rows);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
    ptyProcess.kill(); // Cleanup: Terminal process khatam karo
  });
});

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database Connected & Synced!");

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
