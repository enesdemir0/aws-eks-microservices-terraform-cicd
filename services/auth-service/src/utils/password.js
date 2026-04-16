import bcrypt from 'bcryptjs';

// Hash a password before saving to DB
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare entered password with hashed password in DB
export const comparePassword = async (password, hashedPathword) => {
  return bcrypt.compare(password, hashedPathword);
};