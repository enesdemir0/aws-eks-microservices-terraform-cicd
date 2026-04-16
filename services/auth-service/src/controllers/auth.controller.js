import * as authService from '#services/auth.service';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Call the service layer
    const result = await authService.loginUser(username, password);

    // Return success
    return res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    // We use 401 (Unauthorized) for login failures
    return res.status(401).json({
      status: 'fail',
      message: error.message
    });
  }
};