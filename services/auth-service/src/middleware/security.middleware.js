import aj from '#config/arcjet';
import logger from '#config/logger';
import config from '#config/index'; // Import our centralized config

export const arcjetProtect = async (req, res, next) => {
  // DEBUG LOG: Let's see exactly what the app thinks the environment is
  // logger.info(`Environment check in middleware: "${config.nodeEnv}"`);

  // Use the config object and trim any hidden spaces
  const env = config.nodeEnv.trim();

  if (env === 'test' || env === 'development') {
    return next();
  }

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      logger.warn(`🛡️ Arcjet blocked request from ${req.ip}: ${decision.reason.type}`);

      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ status: 'fail', message: 'Too many requests.' });
      }
      return res.status(403).json({ status: 'fail', message: 'Forbidden.' });
    }

    next();
  } catch (err) {
    logger.warn(`Arcjet check failed, failing open: ${err.message}`);
    next();
  }
};