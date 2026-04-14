import request from 'supertest';
import app from '../src/app.js';

describe('Auth Service Health Check', () => {
  it('should return 200 OK for /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});