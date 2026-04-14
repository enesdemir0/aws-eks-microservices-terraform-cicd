import express from 'express';
// OLD: import logger from './config/logger.js';
import logger from '#config/logger';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  logger.info('Health check triggered');
  res.status(200).json({ status: 'OK' });
});

export default app;