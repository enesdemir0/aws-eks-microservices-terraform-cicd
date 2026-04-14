const express = require('express');
const logger = require('./config/logger');
const config = require('./config');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// A simple test route
app.get('/health', (req, res) => {
  logger.info('Health check triggered');
  res.status(200).json({ status: 'OK' });
});

module.exports = app;