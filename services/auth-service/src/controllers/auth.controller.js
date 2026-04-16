import * as authService from '#services/auth.service';
import catchAsync from '#utils/catchAsync';
import ApiError from '#utils/ApiError';

export const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  
  const result = await authService.loginUser(username, password);

  // If result is null (though our service throws errors), handle it
  if (!result) {
    throw new ApiError(401, 'Invalid credentials');
  }

  res.status(200).json({
    status: 'success',
    data: result
  });
});