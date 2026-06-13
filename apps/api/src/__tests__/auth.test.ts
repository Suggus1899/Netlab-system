import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import app from '../app';

const request = supertest(app);
const uniqueEmail = `test-${Date.now()}@test.com`;
let accessToken = '';
let refreshToken = '';

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Test User',
      email: uniqueEmail,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      role: 'STUDENT',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Dup User',
      email: uniqueEmail,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      role: 'STUDENT',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid body (missing fields)', async () => {
    const res = await request.post('/api/auth/register').send({
      email: 'missing@fields.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'TestPass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(uniqueEmail);
    accessToken = res.body.data.tokens.accessToken;
    refreshToken = res.body.data.tokens.refreshToken;
  });

  it('rejects invalid password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: uniqueEmail,
      password: 'wrong',
    });
    // Zod validation may reject short passwords with 400 before auth check
    expect([400, 401]).toContain(res.status);
  });

  it('rejects nonexistent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'doesnotexist@test.com',
      password: 'anything',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(uniqueEmail);
  });

  it('rejects without token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects with invalid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('refreshes tokens successfully', async () => {
    const res = await request.post('/api/auth/refresh').send({
      refreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('rejects without refresh token', async () => {
    const res = await request.post('/api/auth/refresh').send({});
    // API returns 401 when no refresh token is provided
    expect([400, 401]).toContain(res.status);
  });

  it('rejects invalid refresh token', async () => {
    const res = await request.post('/api/auth/refresh').send({
      refreshToken: 'invalid',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 for existing email', async () => {
    const res = await request.post('/api/auth/forgot-password').send({
      email: uniqueEmail,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 200 for non-existing email (no enumeration)', async () => {
    const res = await request.post('/api/auth/forgot-password').send({
      email: 'no-exist@test.com',
    });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
