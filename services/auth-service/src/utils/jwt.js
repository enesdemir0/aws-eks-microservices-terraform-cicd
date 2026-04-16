import jwt from 'jsonwebtoken';
import config from '#config/index';

export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '1h', // Good for security
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};