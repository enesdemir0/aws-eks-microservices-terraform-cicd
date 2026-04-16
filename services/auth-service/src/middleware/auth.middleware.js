import { verifyToken } from '#utils/jwt';
import ApiError from '#utils/ApiError';
import catchAsync from '#utils/catchAsync';
import * as User from '#models/user.model';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Prefer HttpOnly cookie; fall back to Bearer header for API clients
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'You are not logged in. Please log in to get access.');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid token.');
  }

  const currentUser = await User.findUserById(decoded.id);
  if (!currentUser) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  req.user = currentUser;
  next();
});
