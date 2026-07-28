const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const Groq = require('groq-sdk');

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
const deploymentRoutes = require('./routes/deployment.routes');
const organizationRoute = require('./routes/organization.routes');
const permissionRoutes = require('./routes/permissions.routes');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    frameguard: false, // <-- Ye line add karo
  })
);

app.use(cors());   // Cross-origin requests allow karne ke liye
app.use(morgan('dev')); // Console mein requests log karne ke liye
app.use(express.json()); // JSON data handle karne ke liye

// Groq Client Setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// AI Text / Code Generation Route
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt required hai.' 
      });
    }

    // Call Groq Llama 3 Model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding assistant and AI helper for UCollyx platform. Provide clean, concise code and helpful answers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // Llama 3.3 70B Fast & Smart Model
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'No response generated.';

    res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('Groq API Error:', error.message || error);
    res.status(500).json({
      success: false,
      error: 'AI service se connect karne mein issue aaya.',
    });
  }
});

app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));
app.use('/uploads/logos', express.static(path.join(__dirname, '../uploads/logos')));
app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio')));
app.use('/uploads/attachments', express.static(path.join(__dirname, '../uploads/attachments')));
app.use('/uploads/issues', express.static(path.join(__dirname, '../uploads/issues')));

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
app.use("/api/sprints", sprintRoutes);
app.use('/api/admin', adminRoute);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/organizations', organizationRoute);

app.use(proxyRoute);

module.exports = app;