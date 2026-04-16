import { comparePassword } from '#utils/password';
import { generateToken } from '#utils/jwt';
import { findUserByUsername } from '../models/user.model.js';
import ApiError from '#utils/ApiError'; // Import the custom error class
import logger from '#config/logger';

export const loginUser = async (username, password) => {
  const user = await findUserByUsername(username);

  if (!user) {
    logger.warn(`Login failed: User ${username} not found`);
    // Change 'new Error' to 'new ApiError'
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.warn(`Login failed: Wrong password for ${username}`);
    // Change 'new Error' to 'new ApiError'
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken({ id: user.id, username: user.username });
  return { token, user: { id: user.id, username: user.username } };
};