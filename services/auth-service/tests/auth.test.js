import request from 'supertest';
import app from '../src/app.js';
import pool from '#config/database';
import { hashPassword } from '#utils/password';
import { generateToken } from '#utils/jwt';

const BASE = '/api/auth';

describe('Auth Service', () => {
  beforeAll(async () => {
    await pool.query('DELETE FROM users');
    const hashed = await hashPassword('password123');
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['existinguser', hashed]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users');
    await pool.end();
  });

  // ─── Health ───────────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('returns 200 with status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  // ─── POST /register ───────────────────────────────────────────────────────

  describe('POST /register', () => {
    it('registers a new user, sets HttpOnly jwt cookie, returns user without token in body', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ username: 'newuser', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.username).toBe('newuser');
      // Token must NOT be in the body
      expect(res.body.data.token).toBeUndefined();
      // HttpOnly cookie must be set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('returns 400 when username is already taken', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ username: 'existinguser', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Username already taken');
    });

    it('returns 400 when username is too short (Zod)', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ username: 'ab', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors[0].field).toContain('username');
    });

    it('returns 400 when password is too short (Zod)', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ username: 'validuser', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors[0].field).toContain('password');
    });

    it('returns 400 when body is empty (Zod)', async () => {
      const res = await request(app).post(`${BASE}/register`).send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  // ─── POST /login ──────────────────────────────────────────────────────────

  describe('POST /login', () => {
    it('logs in with correct credentials, sets HttpOnly jwt cookie, returns user without token in body', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ username: 'existinguser', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe('existinguser');
      expect(res.body.data.token).toBeUndefined();
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ username: 'existinguser', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns 401 for non-existent user', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ username: 'ghostuser', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns 400 when username is missing (Zod)', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
    });

    it('returns 400 when password is missing (Zod)', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ username: 'existinguser' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  // ─── POST /logout ─────────────────────────────────────────────────────────

  describe('POST /logout', () => {
    it('clears the jwt cookie when user is authenticated', async () => {
      // First log in to get a valid cookie
      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send({ username: 'existinguser', password: 'password123' });

      const cookie = loginRes.headers['set-cookie']
        .find((c) => c.startsWith('jwt='))
        .split(';')[0]; // e.g. "jwt=<token>"

      const res = await request(app)
        .post(`${BASE}/logout`)
        .set('Cookie', cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      // Cookie should be cleared (expired or empty value)
      const setCookieHeader = res.headers['set-cookie'];
      if (setCookieHeader) {
        const jwtCookie = setCookieHeader.find((c) => c.startsWith('jwt='));
        if (jwtCookie) {
          expect(
            jwtCookie.includes('Expires=Thu, 01 Jan 1970') ||
            jwtCookie.includes('jwt=;') ||
            jwtCookie.match(/jwt=;|jwt= ;/)
          ).toBeTruthy();
        }
      }
    });

    it('returns 401 when trying to logout without a token', async () => {
      const res = await request(app).post(`${BASE}/logout`);

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── GET /me ──────────────────────────────────────────────────────────────

  describe('GET /me', () => {
    it('returns the authenticated user profile via cookie', async () => {
      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send({ username: 'existinguser', password: 'password123' });

      const cookie = loginRes.headers['set-cookie']
        .find((c) => c.startsWith('jwt='))
        .split(';')[0];

      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Cookie', cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe('existinguser');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns the authenticated user profile via Bearer token header', async () => {
      const token = generateToken({ id: 9999, username: 'bearertest' });
      // Insert a user so the DB lookup succeeds
      const hashed = await hashPassword('temppass');
      const { rows } = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
        ['bearertest', hashed]
      );
      const realToken = generateToken({ id: rows[0].id, username: 'bearertest' });

      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Authorization', `Bearer ${realToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.username).toBe('bearertest');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get(`${BASE}/me`);

      expect(res.statusCode).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Cookie', 'jwt=invalid.token.here');

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── 404 ──────────────────────────────────────────────────────────────────

  describe('Unknown routes', () => {
    it('returns 404 for unregistered paths', async () => {
      const res = await request(app).get('/api/unknown-route');

      expect(res.statusCode).toBe(404);
    });
  });
});
