import * as authService from '#services/auth.service';
import logger from '#config/logger';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.loginUser(username, password);

    return res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    // Log the REAL error for the developer to see in the terminal
    logger.error(`Login Error: ${error.message}`);

    // But send a generic "Safe" message to the user/tester
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid credentials'
    });
  }
};