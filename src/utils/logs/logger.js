// /src/utils/logger.js
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Logs directory path
const logDir = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 1. File Logger Format: PURE SINGLE-LINE JSON (Essential for Express JSON.parse & Matrix component)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json() // Creates single-line {"timestamp": "...", "level": "...", "message": "..."}
);

// 2. Console Format for Developers (Readable with Colors)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  })
);

// 3. Main Overall Logger Instance
const mainLogger = winston.createLogger({
  level: 'info',
  format: fileLogFormat, // Default file format is now pure JSON
  defaultMeta: { service: 'ucollyx-backend' },
  transports: [
    // Store regular info activity (Single line JSON per entry)
    new winston.transports.File({
      filename: path.join(logDir, 'overall-activity.log'),
      level: 'info'
    }),
    // Store errors separately
    new winston.transports.File({
      filename: path.join(logDir, 'errors.log'),
      level: 'error'
    })
  ]
});

// Always print readable logs to console in non-production environments
if (process.env.NODE_ENV !== 'production') {
  mainLogger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// 4. FUNCTION TO CREATE A WORKSPACE-SPECIFIC LOGGER
const getWorkspaceLogger = (workspaceSlug) => {
  if (!workspaceSlug) return mainLogger;

  const workspaceLogDir = path.join(logDir, 'workspaces');
  if (!fs.existsSync(workspaceLogDir)) {
    fs.mkdirSync(workspaceLogDir, { recursive: true });
  }

  return mainLogger.child({
    workspaceSlug,
    transports: [
      new winston.transports.File({
        filename: path.join(workspaceLogDir, `${workspaceSlug}-activity.log`),
        level: 'info'
      })
    ]
  });
};

module.exports = {
  mainLogger,
  getWorkspaceLogger
};