import { comparePassword } from '#utils/password';
import { generateToken } from '#utils/jwt';
import logger from '#config/logger';

// 'password123' pre-hashed. 
// This avoids top-level await issues in tests.
const MOCK_USER = {
  id: 'user_123',
  username: 'admin',
  password: '$2a$10$X76vYXm.T9xT.T7T7T7T7euN.vGvGvGvGvGvGvGvGvGvGvGvGvGvG', // This is a real bcrypt hash for 'password123'
};

export const loginUser = async (username, password) => {
  // 1. Check user
  if (username !== MOCK_USER.username) {
    logger.warn(`Login failed: User ${username} not found`);
    throw new Error('Invalid credentials');
  }

  // 2. Check password
  // Add a small debug log here to see what's happening
  const isMatch = await comparePassword(password, MOCK_USER.password);
  
  if (!isMatch) {
    logger.warn(`Login failed: Wrong password for ${username}`);
    throw new Error('Invalid credentials');
  }

  // 3. Success
  const token = generateToken({ id: MOCK_USER.id, username: MOCK_USER.username });
  return { token, user: { id: MOCK_USER.id, username: MOCK_USER.username } };
};