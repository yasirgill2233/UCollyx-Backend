// src/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: console.log, // Isay 'true' ya 'console.log' rakhen taake queries dikhein
        connectTimeout: 10000 // 10 seconds ka timeout rakhen
    }
);

const connectDB = async () => {
    try {
        console.log('⏳ Connecting to MySQL...');
        await sequelize.authenticate();
        console.log('MySQL Connected Successfully!');
    } catch (error) {
        console.error('onnection Error Details:', error.message);
    }
};

module.exports = { sequelize, connectDB };