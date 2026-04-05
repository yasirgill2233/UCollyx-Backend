const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.route');

const app = express();

// Global Middlewares
app.use(helmet()); // Security headers ke liye
app.use(cors());   // Cross-origin requests allow karne ke liye
app.use(morgan('dev')); // Console mein requests log karne ke liye
app.use(express.json()); // JSON data handle karne ke liye

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/uploads', express.static('uploads'));



app.get('/', (req, res) => {
    console.log('API is running successfully!');
    res.status(200).send('API is running successfully!');
});

module.exports = app;