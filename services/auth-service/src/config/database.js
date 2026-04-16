import pg from 'pg';
import config from '#config/index';
import logger from '#config/logger';

const { Pool } = pg;

if (!config.databaseUrl) {
  logger.error('DATABASE_URL is not defined in environment variables!');
}

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export default pool;