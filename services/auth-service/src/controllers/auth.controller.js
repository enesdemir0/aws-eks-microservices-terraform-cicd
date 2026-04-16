import * as authService from '#services/auth.service';
import catchAsync from '#utils/catchAsync';
import { setCookie, clearCookie } from '#utils/cookies';

export const register = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.registerUser(username, password);

  setCookie(res, result.token);

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: { user: result.user },
  });
});

export const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.loginUser(username, password);

  setCookie(res, result.token);

  res.status(200).json({
    status: 'success',
    data: { user: result.user },
  });
});

export const logout = catchAsync(async (req, res) => {
  clearCookie(res);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});
