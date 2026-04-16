import request from 'supertest';
import app from '../src/app.js';

describe('Auth Service - Login Logic', () => {
  
  it('should return a JWT token when credentials are valid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token'); // Check if token exists
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