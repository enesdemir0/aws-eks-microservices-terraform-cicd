import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from '#routes/auth.routes';
import globalErrorHandler from '#middleware/error.middleware';
import ApiError from '#utils/ApiError';

const app = express();

// 1. SET SECURITY HTTP HEADERS
app.use(helmet());

// 2. LIMIT REQUESTS (Prevents Brute Force)
const limiter = rateLimit({
  max: 100, // 100 requests per hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); // Limit body size

// Routes
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

export default app;