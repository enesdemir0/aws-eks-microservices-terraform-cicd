import request from 'supertest';
import app from '../src/app.js';
import pool from '#config/database';
import { hashPassword } from '#utils/password';

describe('Auth Service - Login Logic', () => {
  
  // This runs BEFORE any tests start
  beforeAll(async () => {
    // 1. Clean the table
    await pool.query('DELETE FROM users');
    
    // 2. Hash 'password123' using our REAL app logic
    const hashedPassword = await hashPassword('password123');
    
    // 3. Insert the test user
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      ['admin', hashedPassword]
    );
  });

  // This runs AFTER all tests are done
  afterAll(async () => {
    await pool.end();
  });

  it('should return a JWT token when credentials are valid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.username).toBe('admin');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrong-password'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toBe('Invalid credentials');
  });
});