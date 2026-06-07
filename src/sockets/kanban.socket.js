module.exports = (io, socket) => {
  
  // 1. Project Board Room Join Karna
  socket.on("project:join_room", ({ project_id }) => {
    if (!project_id) return;
    
    const roomName = `project_room:${project_id}`;
    socket.join(roomName);
    console.log(`📋 Developer entered Project Kanban Matrix: ${roomName} via socket ${socket.id}`);
  });

  // 2. Drag & Drop Position Sync Listener
  socket.on("board:task_moved", (data) => {
    if (!data || !data.project_id) return;

    const roomName = `project_room:${data.project_id}`;
    // Bhejne wale ke ilawa baqi sab developers ko update notify karein
    socket.to(roomName).emit("board:task_moved_received", data);
    console.log(`🔄 Task ${data.task_id} shifted position in Project Room: ${roomName}`);
  });

  // 3. Task Create Sync Listener
  socket.on("board:task_created", (data) => {
    if (!data || !data.project_id) return;

    const roomName = `project_room:${data.project_id}`;
    socket.to(roomName).emit("board:task_created_received", data);
    console.log(`✨ New Task created on board for Project Room: ${roomName}`);
  });

  // 4. Task Details Update Sync (Title, Description, Epic Link)
  socket.on("board:task_updated", (data) => {
    if (!data || !data.project_id) return;

    const roomName = `project_room:${data.project_id}`;
    socket.to(roomName).emit("board:task_updated_received", data);
    console.log(`📝 Task details updated dynamically in Project Room: ${roomName}`);
  });
};