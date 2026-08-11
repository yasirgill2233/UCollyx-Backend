const onlineUsers = new Map();

module.exports = (io, socket) => {
  socket.on("user_online", (userId) => {
    if (!userId) return;

    const stringUserId = String(userId);
    onlineUsers.set(stringUserId, socket.id);
    socket.authenticatedUserId = stringUserId;

    socket.join(`user_room:${stringUserId}`);

    io.emit("update_online_users", Array.from(onlineUsers.keys()));
    console.log(
      `🟢 Developer Presence Loaded: User ${stringUserId} verified via socket ${socket.id}`,
    );
  });

  socket.on("join_chat_room", ({ roomName }) => {
    if (!roomName) return;
    socket.join(roomName);
    console.log(
      `🚪 Channel Matrix Room Connection Established: ${roomName} for socket ${socket.id}`,
    );
  });

  socket.on("chat:typing", ({ roomName, userName, avatarUrl }) => {
    socket.to(roomName).emit("chat:user_typing", {
      userId: socket.authenticatedUserId,
      userName,
      avatarUrl
    });
    console.log(`✍️  ${userName} is typing in room: ${roomName}`);
  });

  socket.on("chat:stop_typing", ({ roomName }) => {
    socket.to(roomName).emit("chat:user_stop_typing", {
      userId: socket.authenticatedUserId,
    });
    console.log(`🛑 User stopped typing in room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    if (socket.authenticatedUserId) {
      if (onlineUsers.get(socket.authenticatedUserId) === socket.id) {
        onlineUsers.delete(socket.authenticatedUserId);
      }

      io.emit("update_online_users", Array.from(onlineUsers.keys()));
      console.log(
        `🔴 Presence Offloaded: User ${socket.authenticatedUserId} went offline.`,
      );
    }
  });
};
