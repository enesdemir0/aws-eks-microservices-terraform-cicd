const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // In production, logs are best read as JSON
  ),
  transports: [
    new winston.format.colorize(), // Add colors for your local terminal
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;