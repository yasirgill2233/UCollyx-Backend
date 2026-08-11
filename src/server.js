const http = require("http");
const app = require("./app");
const dotenv = require("dotenv");
const db = require("./models/index");

const { initSocket } = require("./config/socket");
const registerTerminalHandlers = require("./sockets/terminal.socket");
const registerChatHandlers = require("./sockets/chat.socket");
const registerKanbanHandlers = require("./sockets/kanban.socket");

dotenv.config();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = initSocket(server);
global.io = io;

io.on("connection", (socket) => {
  console.log(`⚡ Connected device session ID allocation: ${socket.id}`);

  registerTerminalHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerKanbanHandlers(io, socket);
});

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("💾 Database Connected & Synced natively!");

    server.listen(PORT, () => {
      console.log(`
      ###########################################################
             UCollyx Modular Server Core Up on Port: ${PORT} 
             Terminal Processing Engine: ACTIVE [Separated]
             Real-Time Chat & Communications Network: ACTIVE [Separated]
      ###########################################################
      `);
    });
  } catch (error) {
    console.error("❌ Fatal System Initialization Failure:", error.message);
    process.exit(1);
  }
};

startServer();