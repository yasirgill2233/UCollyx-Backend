const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.route');
const projectRoutes = require('./routes/project.routes');
const channelRoutes = require('./routes/channel.routes');
const messageRoutes = require('./routes/message.routes');
const meetingRoutes = require('./routes/meeting.routes');
const notificationRoutes = require('./routes/notification.routes');
const taskRoute = require('./routes/task.routes');
const issueRoute = require('./routes/issue.routes');
const teamRoute = require('./routes/team.routes');
const gitRoute = require('./routes/gitRoute.routes');
const fileRoute = require('./routes/file.routes');
const proxyRoute = require('./routes/proxy.routes');
const adminRoute = require('./routes/admin.routes');
const sprintRoutes = require('./routes/sprint.routes');
const webhookRoutes = require('./routes/webhooks.routes');
const organizationRoute = require('./routes/organization.routes');

const app = express();

// app.use(helmet()); // Security headers ke liye
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());   // Cross-origin requests allow karne ke liye
app.use(morgan('dev')); // Console mein requests log karne ke liye
app.use(express.json()); // JSON data handle karne ke liye

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/projects', projectRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoute);
app.use('/api/team', teamRoute);
app.use('/api/issues', issueRoute);
app.use('/api/git', gitRoute);
app.use('/api/files', fileRoute);
app.use('/api/proxy', proxyRoute);
app.use("/api/sprints", sprintRoutes);
app.use('/api/admin', adminRoute);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/organizations', organizationRoute);


// Logos folder static mapping
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));
app.use('/uploads/logos', express.static(path.join(__dirname, '../uploads/logos')));
app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio')));
app.use('/uploads/attachments', express.static(path.join(__dirname, '../uploads/attachments')));
app.use('/uploads/issues', express.static(path.join(__dirname, '../uploads/issues')));


module.exports = app;