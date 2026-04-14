import express from 'express';
import logger from '#config/logger';
import authRoutes from '#routes/auth.routes'; // Import the routes

const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // All auth routes start with /api/auth

app.get('/health', (req, res) => {
  logger.info('Health check triggered');
  res.status(200).json({ status: 'OK' });
});

export default app;