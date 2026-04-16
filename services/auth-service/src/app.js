import express from 'express';
import authRoutes from '#routes/auth.routes';
import globalErrorHandler from '#middleware/error.middleware';
import ApiError from '#utils/ApiError';
import logger from '#config/logger';

const app = express();

app.use(express.json());

// 1. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 2. Real Routes
app.use('/api/auth', authRoutes);

// 3. 404 Handler - This is the fix!
// If no route above matches, this middleware will run.
app.use((req, res, next) => {
  const error = new ApiError(404, `Can't find ${req.originalUrl} on this server!`);
  next(error);
});

// 4. GLOBAL ERROR HANDLER - Must be last!
app.use(globalErrorHandler);

export default app;