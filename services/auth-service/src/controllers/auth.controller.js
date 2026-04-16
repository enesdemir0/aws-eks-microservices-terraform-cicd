import * as authService from '#services/auth.service';
import catchAsync from '#utils/catchAsync';

export const register = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  
  const result = await authService.registerUser(username, password);

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: result
  });
});

export const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.loginUser(username, password);

  res.status(200).json({
    status: 'success',
    data: result
  });
});


export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user // req.user was set by the 'protect' middleware
    }
  });
});