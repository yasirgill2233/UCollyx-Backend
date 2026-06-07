const { Server } = require("socket.io");

let io = null;

module.exports = {
  initSocket: (server) => {
    io = new Server(server, {
      cors: {
        origin: "*", // Production par isay precise dynamic domain mapping de sakte hain
        methods: ["GET", "POST"],
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error("❌ Socket core instance initialize nahi hai!");
    return io;
  }
};