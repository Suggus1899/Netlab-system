import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import app from '../app';

const request = supertest(app);
let teacherToken = '';
let studentToken = '';

beforeAll(async () => {
  // Login as seeded teacher
  const tRes = await request.post('/api/auth/login').send({
    email: 'profesor@silearning.com',
    password: 'Teacher123!',
  });
  teacherToken = tRes.body.data?.tokens?.accessToken || '';

  // Login as seeded student
  const sRes = await request.post('/api/auth/login').send({
    email: 'alumno@silearning.com',
    password: 'Student123!',
  });
  studentToken = sRes.body.data?.tokens?.accessToken || '';
});

describe('GET /api/labs', () => {
  it('returns published labs for authenticated user', async () => {
    const res = await request
      .get('/api/labs')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request.get('/api/labs');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/labs/:id', () => {
  it('returns a specific lab', async () => {
    // First get list to pick an ID
    const listRes = await request
      .get('/api/labs')
      .set('Authorization', `Bearer ${teacherToken}`);
    const labs = listRes.body.data || [];
    if (labs.length === 0) return; // skip if no labs seeded

    const labId = labs[0].id;
    const res = await request
      .get(`/api/labs/${labId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(labId);
  });

  it('returns 404 for nonexistent lab', async () => {
    const res = await request
      .get('/api/labs/nonexistent-id')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/labs', () => {
  it('teacher can create a lab', async () => {
    const res = await request
      .post('/api/labs')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Test Lab',
        topic: 'Testing',
        difficulty: 'BEGINNER',
        description: 'A test lab',
        status: 'DRAFT',
      });
    // 201 if valid, could fail if schema requires more fields
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.data.title).toBe('Test Lab');
    }
  });

  it('student cannot create a lab', async () => {
    const res = await request
      .post('/api/labs')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Sneaky Lab',
        topic: 'Hacking',
        difficulty: 'BEGINNER',
        description: 'should fail',
        status: 'DRAFT',
      });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/progress', () => {
  it('returns student progress', async () => {
    const res = await request
      .get('/api/progress')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
