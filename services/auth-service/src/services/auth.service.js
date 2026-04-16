import { comparePassword, hashPassword } from '#utils/password';
import { generateToken } from '#utils/jwt';
import logger from '#config/logger';

// Mock User (We will replace this with a Database later)
// Note: In a real app, 'hashedPassword' would come from your DB
const MOCK_USER = {
  id: 'user_123',
  username: 'admin',
  // This is the hash for the string 'password123'
  password: await hashPassword('password123'), 
};

export const loginUser = async (username, password) => {
  // 1. Check if user exists
  if (username !== MOCK_USER.username) {
    logger.warn(`Login failed: User ${username} not found`);
    throw new Error('Invalid credentials');
  }

  // 2. Check if password is correct
  const isMatch = await comparePassword(password, MOCK_USER.password);
  if (!isMatch) {
    logger.warn(`Login failed: Wrong password for ${username}`);
    throw new Error('Invalid credentials');
  }

  // 3. Generate Token
  const token = generateToken({ id: MOCK_USER.id, username: MOCK_USER.username });
  
  logger.info(`User ${username} logged in successfully`);
  return { token, user: { id: MOCK_USER.id, username: MOCK_USER.username } };
};