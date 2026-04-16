import { comparePassword } from '#utils/password';
import { generateToken } from '#utils/jwt';
import { findUserByUsername } from '../models/user.model.js';
import logger from '#config/logger';

export const loginUser = async (username, password) => {
  // 1. Get real user from DB
  const user = await findUserByUsername(username);

  if (!user) {
    logger.warn(`Login failed: User ${username} not found`);
    throw new Error('Invalid credentials');
  }

  // 2. Check password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.warn(`Login failed: Wrong password for ${username}`);
    throw new Error('Invalid credentials');
  }

  // 3. Success
  const token = generateToken({ id: user.id, username: user.username });
  return { token, user: { id: user.id, username: user.username } };
};