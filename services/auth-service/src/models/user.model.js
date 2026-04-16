import pool from '#config/database';

export const findUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

export const createUser = async (username, hashedPassword) => {
  const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at';
  const result = await pool.query(query, [username, hashedPassword]);
  return result.rows[0];
};

export const findUserById = async (id) => {
  const query = 'SELECT id, username, created_at FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};