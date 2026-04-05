const app = require('./app');
const dotenv = require('dotenv');
const { sequelize, connectDB } = require('./config/db');

const db = require('./models/index')

// console.log(db.sequelize.models.User)

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // await connectDB();
        await db.sequelize.authenticate();
        // await db.sequelize.sync({ force: true }); 
        console.log('Database Tables Synced!');

        app.listen(PORT, () => {
            console.log(`
            ################################################
                   Server listening on port: ${PORT} 
            ################################################
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1); // Error ki surat mein process band kar dein
    }
};

startServer();