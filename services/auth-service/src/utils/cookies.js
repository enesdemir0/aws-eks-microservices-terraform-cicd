import config from '#config/index';

const COOKIE_NAME = 'jwt';

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 1000, // 1 hour — matches JWT expiry
};

export const setCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions);
};

export const clearCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  });
};
