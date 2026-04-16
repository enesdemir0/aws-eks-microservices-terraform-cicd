import pool from '#config/database';

export const findUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0]; // Returns the user or undefined
};

// We will need this for the first time setup
export const createUser = async (username, hashedPassword) => {
  const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username';
  const result = await pool.query(query, [username, hashedPassword]);
  return result.rows[0];
};