import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET, // No hardcoded fallback in code!
  databaseUrl: process.env.DATABASE_URL,
};

export default config;