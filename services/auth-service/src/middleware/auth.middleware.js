import { verifyToken } from '#utils/jwt';
import ApiError from '#utils/ApiError';
import catchAsync from '#utils/catchAsync';
import * as User from '../models/user.model.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'You are not logged in. Please log in to get access.');
  }

  // 2. Verify token
  const decoded = verifyToken(token);

  // 3. Check if user still exists in DB
  const currentUser = await User.findUserById(decoded.id); // We need to add this to model!
  if (!currentUser) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  // 4. Grant access to protected route
  req.user = currentUser;
  next();
});