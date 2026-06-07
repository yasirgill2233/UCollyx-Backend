const onlineUsers = new Map(); // Key: userId -> Value: socketId

module.exports = (io, socket) => {
  // 1. User Online Activity Synchronization
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

  // 2. Persistent Collaboration Chat Rooms Linking
  socket.on("join_chat_room", ({ roomName }) => {
    if (!roomName) return;
    socket.join(roomName);
    console.log(
      `🚪 Channel Matrix Room Connection Established: ${roomName} for socket ${socket.id}`,
    );
  });

  // 1. User ne type karna shuru kiya
  socket.on("chat:typing", ({ roomName, userName, avatarUrl }) => {
    // Jis room mein user type kar raha hai, baqi sab ko broadcast kar dein (except the sender)
    socket.to(roomName).emit("chat:user_typing", {
      userId: socket.authenticatedUserId,
      userName,
      avatarUrl
    });
    console.log(`✍️  ${userName} is typing in room: ${roomName}`);
  });

  // 2. User ne type karna chorh diya (ya input empty chorh di)
  socket.on("chat:stop_typing", ({ roomName }) => {
    socket.to(roomName).emit("chat:user_stop_typing", {
      userId: socket.authenticatedUserId,
    });
    console.log(`🛑 User stopped typing in room: ${roomName}`);
  });

  // 3. Central Cleanup intercept on processing connection dropout
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
