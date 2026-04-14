import app from './app.js';
import config from '#config/index';
import logger from '#config/logger';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Auth Service is running on port ${PORT} in ${config.nodeEnv} mode`);
});