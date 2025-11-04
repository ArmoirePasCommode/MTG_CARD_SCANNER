import request from 'supertest';
import { app } from '../src/server/app';

describe('Auth routes', () => {
  it('rejects signup without fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({});
    expect(res.status).toBe(400);
  });
});

