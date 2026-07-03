const http = require("http");
const app = require("./app");
const dotenv = require("dotenv");
const db = require("./models/index");

// Socket layers structural routers distribution modules imports
const { initSocket } = require("./config/socket");
const registerTerminalHandlers = require("./sockets/terminal.socket");
const registerChatHandlers = require("./sockets/chat.socket");
const registerKanbanHandlers = require("./sockets/kanban.socket");

dotenv.config();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Global Core Socket Engine
const io = initSocket(server);
global.io = io;

// --- PIPELINES ROUTER SPLITTING DISPATCHER ---
io.on("connection", (socket) => {
  console.log(`⚡ Connected device session ID allocation: ${socket.id}`);

  // Modular separation mappings distribution executing seamlessly
  registerTerminalHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerKanbanHandlers(io, socket);
});

// --- SERVER ENGINE FIRING PIPELINE ---
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("💾 Database Connected & Synced natively!");

  // db.sequelize.sync({ alter: true })


  // Database Sync logic wale block mein (e.g., server.js ya jahan sync call ho rha hai)
db.sequelize.sync({ alter: true }).then(async () => {
  console.log("🚀 Database connected and synced successfully!");

  try {
    // 1. Check karo ke permissions table mein pehle se data hai ya nahi
    const permissionCount = await db.Permission.count();

    if (permissionCount === 0) {
      console.log("🌱 Permissions table empty hai! Seeding data...");
      const now = new Date();

      const defaultPermissions = [
        // 💻 DEVELOPER PERMISSIONS (Role: dev)
        { role: 'dev', label: 'Overview', route: '/dev/dashboard', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'Projects', route: '/dev/my-projects', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'Issues', route: '/dev/issues', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'Kanban', route: '/dev/board', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'IDE', route: '/dev/ide', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'Chat', route: '/dev/chat', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'Directories', route: '/dev/projects-dir', enabled: true, createdAt: now, updatedAt: now },
        { role: 'dev', label: 'Meetings', route: '/dev/meetings', enabled: true, createdAt: now, updatedAt: now },

        // 💼 MANAGER PERMISSIONS (Role: manager)
        { role: 'manager', label: 'Portfolio', route: '/manager/portfolio', enabled: true, createdAt: now, updatedAt: now },
        { role: 'manager', label: 'Team Activity', route: '/manager/activity', enabled: true, createdAt: now, updatedAt: now },
        { role: 'manager', label: 'Project Tasks', route: '/manager/tasks', enabled: true, createdAt: now, updatedAt: now },
        { role: 'manager', label: 'IDE', route: '/manager/ide', enabled: true, createdAt: now, updatedAt: now },
        { role: 'manager', label: 'Chat', route: '/manager/chat', enabled: true, createdAt: now, updatedAt: now },
        { role: 'manager', label: 'Directories', route: '/manager/projects-dir', enabled: true, createdAt: now, updatedAt: now },
        { role: 'manager', label: 'Meetings', route: '/manager/meetings', enabled: true, createdAt: now, updatedAt: now },

        // 🧪 QA PERMISSIONS (Role: qa)
        { role: 'qa', label: 'QA Dashboard', route: '/qa/dashboard', enabled: true, createdAt: now, updatedAt: now },
        { role: 'qa', label: 'Red Alerts', route: '/qa/alerts', enabled: true, createdAt: now, updatedAt: now },
        { role: 'qa', label: 'Report Bug', route: '/qa/report-bug', enabled: true, createdAt: now, updatedAt: now },
        { role: 'qa', label: 'Verification', route: '/qa/verify-task', enabled: true, createdAt: now, updatedAt: now },
        { role: 'qa', label: 'Kanban', route: '/qa/board', enabled: true, createdAt: now, updatedAt: now },
        { role: 'qa', label: 'Chat', route: '/qa/chat', enabled: true, createdAt: now, updatedAt: now },
        { role: 'qa', label: 'Meetings', route: '/qa/meetings', enabled: true, createdAt: now, updatedAt: now },

        // 🏢 ORG ADMIN PERMISSIONS (Role: orgadmin)
        { role: 'orgadmin', label: 'Admin Panel', route: '/org-admin/dashboard', enabled: true, createdAt: now, updatedAt: now },
        { role: 'orgadmin', label: 'Projects', route: '/org-admin/projects', enabled: true, createdAt: now, updatedAt: now },
        { role: 'orgadmin', label: 'Users', route: '/org-admin/users', enabled: true, createdAt: now, updatedAt: now },
        { role: 'orgadmin', label: 'Chat', route: '/org-admin/chat', enabled: true, createdAt: now, updatedAt: now },
        { role: 'orgadmin', label: 'Meetings', route: '/org-admin/meetings', enabled: true, createdAt: now, updatedAt: now },
        { role: 'orgadmin', label: 'Permissions', route: '/org-admin/permissions', enabled: true, createdAt: now, updatedAt: now },

        // 👑 SUPER ADMIN PERMISSIONS (Role: superadmin)
        { role: 'superadmin', label: 'Admin Panel', route: '/super-admin/dashboard', enabled: true, createdAt: now, updatedAt: now },
        { role: 'superadmin', label: 'Organizations', route: '/super-admin/orgs', enabled: true, createdAt: now, updatedAt: now },
        { role: 'superadmin', label: 'Members', route: '/super-admin/roles', enabled: true, createdAt: now, updatedAt: now }
      ];

      // Bulk create standard query run karein ge
      await db.Permission.bulkCreate(defaultPermissions);
      console.log("✅ All initial permissions successfully seeded into the DB!");
    } else {
      console.log("ℹ️ Permissions already exist in the database, seeding skipped.");
    }
  } catch (error) {
    console.error("❌ Seeding error:", error);
  }
});

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