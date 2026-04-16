import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes';
import globalErrorHandler from '#middleware/error.middleware';
import { arcjetProtect } from '#middleware/security.middleware';
import ApiError from '#utils/ApiError';

const app = express();

// 1. SECURITY HEADERS
app.use(helmet());

// 2. RATE LIMITING — last line of defence against brute force
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// 3. BODY + COOKIE PARSING
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. HEALTH CHECK (no auth, no rate limit)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 5. AUTH ROUTES — protected by Arcjet (shield + bot detection + sliding window)
app.use('/api/auth', arcjetProtect, authRoutes);

// 6. UNHANDLED ROUTES
app.use((req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// 7. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

export default app;
