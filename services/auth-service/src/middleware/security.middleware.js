import aj from '#config/arcjet';
import logger from '#config/logger';

export const arcjetProtect = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      logger.warn(`Arcjet blocked request from ${req.ip}: ${decision.reason}`);

      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ status: 'fail', message: 'Too many requests. Please try again later.' });
      }
      if (decision.reason.isBot()) {
        return res.status(403).json({ status: 'fail', message: 'Forbidden.' });
      }
      return res.status(403).json({ status: 'fail', message: 'Forbidden.' });
    }

    next();
  } catch (err) {
    // If Arcjet is unavailable (e.g. missing key in dev), fail open so dev is not blocked
    logger.warn(`Arcjet check failed, failing open: ${err.message}`);
    next();
  }
};
