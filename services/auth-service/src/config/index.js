import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  // Provide a fallback secret so tests don't fail in CI
  jwtSecret: process.env.JWT_SECRET || 'test-secret-key-12345', 
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;