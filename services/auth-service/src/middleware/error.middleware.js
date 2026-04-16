import logger from '#config/logger';
import config from '#config/index';

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error for the developer
  logger.error(`[${req.method}] ${req.path} >> ${err.message}`);

  // In development, send the stack trace for easier debugging
  // In production, we hide the stack trace for security!
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export default globalErrorHandler;