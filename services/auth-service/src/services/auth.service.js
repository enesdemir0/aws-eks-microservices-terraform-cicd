import { comparePassword, hashPassword } from '#utils/password';
import { generateToken } from '#utils/jwt';
import * as User from '#models/user.model';
import ApiError from '#utils/ApiError';
import logger from '#config/logger';

export const registerUser = async (username, password) => {
  // 1. Check if username is already taken
  const existingUser = await User.findUserByUsername(username);
  if (existingUser) {
    logger.warn(`Registration failed: Username ${username} already exists`);
    throw new ApiError(400, 'Username already taken');
  }

  // 2. Hash the password
  const hashedPassword = await hashPassword(password);

  // 3. Create the user in the database
  const newUser = await User.createUser(username, hashedPassword);
  
  // 4. Generate a token so they are logged in immediately
  const token = generateToken({ id: newUser.id, username: newUser.username });

  logger.info(`User registered successfully: ${username}`);
  
  return {
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      createdAt: newUser.created_at
    }
  };
};

export const loginUser = async (username, password) => {
  const user = await User.findUserByUsername(username);

  if (!user) {
    logger.warn(`Login failed: User ${username} not found`);
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    logger.warn(`Login failed: Wrong password for ${username}`);
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken({ id: user.id, username: user.username });
  
  logger.info(`User ${username} logged in successfully`);
  return { token, user: { id: user.id, username: user.username } };
};