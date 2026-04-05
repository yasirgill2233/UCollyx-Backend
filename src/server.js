// const app = require('./app');
// const dotenv = require('dotenv');
// const { sequelize, connectDB } = require('./config/db');

// const db = require('./models/index')

// dotenv.config();

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//     try {
//         // await connectDB();
//         await db.sequelize.authenticate();
//         // await db.sequelize.sync({ force: true }); 
//         console.log('Database Tables Synced!');

//         app.listen(PORT, () => {
//             console.log(`
//             ################################################
//                    Server listening on port: ${PORT} 
//             ################################################
//             `);
//         });
//     } catch (error) {
//         console.error('Failed to start server:', error.message);
//         process.exit(1); // Error ki surat mein process band kar dein
//     }
// };

// startServer();


const http = require('http'); // Standard Node.js HTTP module
const { Server } = require('socket.io'); // Socket.io import
const app = require('./app');
const dotenv = require('dotenv');
const db = require('./models/index');

dotenv.config();
const PORT = process.env.PORT || 5000;

// 1. HTTP Server banayein (Express app ko isme pass karein)
const server = http.createServer(app);

// 2. Socket.io Initialize karein
const io = new Server(server, {
    cors: {
        origin: "*", // Development ke liye, baad mein specify kar sakte hain
        methods: ["GET", "POST"]
    }
});

// 3. WebRTC Signaling Logic
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        // Doosre users ko notification
        socket.to(roomId).emit('user-joined', socket.id);
    });

    // Signaling: Offer/Answer/ICE Candidates
    socket.on('signal', (data) => {
        // data mein to (recipient id), signalData (Offer/Answer), aur from (sender id) hoga
        io.to(data.to).emit('signal', {
            signal: data.signalData,
            from: socket.id
        });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database Connected & Synced!');

        // await db.sequelize.sync({ force: true }); 

        // 4. IMPORTANT: Ab 'app.listen' nahi, 'server.listen' use hoga
        server.listen(PORT, () => {
            console.log(`
            ################################################
                   Server listening on port: ${PORT} 
                   Socket.io is READY!
            ################################################
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();