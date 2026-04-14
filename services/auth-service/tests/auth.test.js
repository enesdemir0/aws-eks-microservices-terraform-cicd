import request from 'supertest';
import app from '../src/app.js';

describe('Auth Service - Login Validation', () => {
  
  it('should return 200 if username and password are valid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Validation passed, you are logged in!');
  });

  it('should return 400 if username is too short', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'ad', // Too short (min 3)
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
    // Check if the specific error message is there
    expect(res.body.errors[0].message).toContain('at least 3 characters');
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin'
        // password missing
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
  });
});