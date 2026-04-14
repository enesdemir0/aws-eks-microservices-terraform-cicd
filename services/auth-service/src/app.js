import express from 'express';
import logger from './config/logger.js'; // Note: In ESM, you must include the .js extension!

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  logger.info('Health check triggered');
  res.status(200).json({ status: 'OK' });
});

export default app;